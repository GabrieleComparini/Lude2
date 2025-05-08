import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { auth as firebaseAuthInstance } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';

// Definizione dei tipi
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<FirebaseUser | undefined>;
  register: (email: string, password: string, displayName?: string) => Promise<FirebaseUser | undefined>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crea il contesto per l'autenticazione con valori predefiniti
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => { throw new Error('AuthContext not ready') },
  register: async () => { throw new Error('AuthContext not ready') },
  logout: async () => { throw new Error('AuthContext not ready') }
});

// Hook personalizzato per utilizzare il contesto
export const useAuth = () => useContext(AuthContext);

// Provider del contesto dell'autenticazione
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authStateUnsubscribe = useRef<(() => void) | null>(null); // To store the unsubscribe function
  const authInstance = firebaseAuthInstance as Auth | undefined;
  
  // Effetto per monitorare lo stato dell'autenticazione
  useEffect(() => {
    if (!authInstance) {
      console.error('AuthProvider: Firebase Auth instance non disponibile.');
      setLoading(false);
      setError('Firebase Auth non inizializzato.');
      return;
    }

    // Prevent re-subscribing if already subscribed
    if (authStateUnsubscribe.current) {
      console.log('AuthProvider: Già sottoscritto a onAuthStateChanged.');
      return;
    }

    console.log('AuthProvider: Configurazione onAuthStateChanged');
    let initTimeoutId: NodeJS.Timeout | undefined = undefined;

    // Set loading to true when starting subscription setup
    // but only if not already loading to avoid loops if authInstance changes
    // setLoading(true); // Re-evaluate if this is needed or contributes to loops

    initTimeoutId = setTimeout(() => {
      console.log('AuthProvider: Timeout di 5 secondi raggiunto durante init onAuthStateChanged');
      // If still loading and no user after timeout, stop loading and possibly set error
      if (loading && !user) { 
        setLoading(false);
        // setError('Timeout durante l\'inizializzazione dell\'autenticazione.');
      }
    }, 5000); // Increased timeout

    const unsubscribe = authInstance.onAuthStateChanged((firebaseUser) => {
      console.log('AuthProvider: onAuthStateChanged chiamato', firebaseUser ? 'con utente' : 'senza utente');
      if (initTimeoutId) clearTimeout(initTimeoutId);
      
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false); // Always set loading to false after callback
    }, (err) => {
      if (initTimeoutId) clearTimeout(initTimeoutId);
      console.error('Auth state change error:', err);
      setError(err.message || 'Errore di autenticazione');
      setLoading(false); // Also here
    });

    authStateUnsubscribe.current = unsubscribe; // Store the unsubscribe function

    return () => {
      console.log('AuthProvider: Pulizia onAuthStateChanged');
      if (initTimeoutId) clearTimeout(initTimeoutId);
      if (authStateUnsubscribe.current) {
        authStateUnsubscribe.current();
        authStateUnsubscribe.current = null; // Clear the stored unsubscribe function
      }
    };
  }, [authInstance]); // Dependency array should primarily be authInstance

  // Funzione di login con auto-timeout
  const login = async (email: string, password: string): Promise<FirebaseUser | undefined> => {
    if (!authInstance) {
      setError('Firebase Auth non disponibile per il login.');
      throw new Error('Firebase Auth non disponibile.');
    }
    setLoading(true);
    setError(null);
    try {
      const loginWithTimeout = Promise.race([
        signInWithEmailAndPassword(authInstance, email, password),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout di login')), 10000)
        )
      ]);
      const userCredential = await loginWithTimeout;
      // setUser is handled by onAuthStateChanged
      return userCredential.user;
    } catch (e: any) {
      console.error('Errore login:', e);
      setError(e.message || 'Errore durante il login');
      // setLoading(false); // Already in finally
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Funzione di registrazione con auto-timeout
  const register = async (email: string, password: string, displayName?: string): Promise<FirebaseUser | undefined> => {
    if (!authInstance) {
      setError('Firebase Auth non disponibile per la registrazione.');
      throw new Error('Firebase Auth non disponibile.');
    }
    setLoading(true);
    setError(null);
    try {
      const registerWithTimeout = Promise.race([
        createUserWithEmailAndPassword(authInstance, email, password),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout di registrazione')), 10000)
        )
      ]);
      const userCredential = await registerWithTimeout;
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      // setUser is handled by onAuthStateChanged
      return userCredential.user;
    } catch (e: any) {
      console.error('Errore registrazione:', e);
      setError(e.message || 'Errore durante la registrazione');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Logout utente
  const logout = async (): Promise<void> => {
    if (!authInstance) {
      setError('Firebase Auth non disponibile per il logout.');
      throw new Error('Firebase Auth non disponibile.');
    }
    setLoading(true);
    setError(null);
    try {
      await signOut(authInstance);
      // setUser(null) is handled by onAuthStateChanged
    } catch (e: any) {
      console.error('Errore logout:', e);
      setError(e.message || 'Errore durante il logout');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Valori forniti dal contesto
  const value: AuthContextType = {
    user,
    loading,
    error,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 