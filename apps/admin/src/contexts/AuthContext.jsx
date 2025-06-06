import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/api';

// Crea contesto di autenticazione
const AuthContext = createContext();

// Hook per utilizzare il contesto di autenticazione
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider del contesto di autenticazione
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login con email e password
  const login = async (email, password) => {
    setError(null);
    try {
      console.log('Tentativo di login con:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login Firebase riuscito, utente:', result.user.uid);
      return result.user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUserData(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sincronizza utente con backend
  const syncUserWithBackend = async (user) => {
    if (!user) return null;
    
    try {
      console.log('Sincronizzazione utente con backend:', user.email);
      const token = await user.getIdToken();
      console.log('Token Firebase ottenuto');
      
      const response = await authService.syncUser(token);
      console.log('Risposta dal backend:', response);
      
      if (response && response.user) {
        console.log('Utente sincronizzato con ruolo:', response.user.role);
        setUserData(response.user);
        return response.user;
      } else {
        console.error('Risposta dal backend non contiene dati utente validi');
        return null;
      }
    } catch (err) {
      console.error('Sync user error:', err);
      if (err.response) {
        console.error('Dettagli errore backend:', err.response.data);
      }
      setError(err.message || 'Errore di sincronizzazione con il backend');
      return null;
    }
  };

  // Verifica se l'utente è admin
  const isAdmin = () => {
    const isAdminUser = userData?.role === 'admin';
    console.log('Verifica ruolo admin:', { userData, isAdmin: isAdminUser });
    return isAdminUser;
  };

  // Osserva cambiamenti stato autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Stato autenticazione cambiato:', user ? `Utente loggato (${user.email})` : 'Nessun utente');
      setCurrentUser(user);
      
      if (user) {
        const userDataFromBackend = await syncUserWithBackend(user);
        console.log('Dati utente dal backend:', userDataFromBackend);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Cleanup della subscription quando il componente si smonta
    return unsubscribe;
  }, []);

  // Valore del contesto
  const value = {
    currentUser,
    userData,
    loading,
    error,
    login,
    logout,
    resetPassword,
    syncUserWithBackend,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 