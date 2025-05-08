import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AppConfig from '../../config/app';

const RegisterScreen = ({ navigation }) => {
  // Stati per i dati del form
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook per l'accesso alle funzioni di autenticazione
  const { register } = useAuth();

  // Validazione email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gestione della registrazione
  const handleRegister = async () => {
    // Reset degli errori
    setError(null);
    
    // Validazione dei campi
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Inserisci un indirizzo email valido');
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }
    
    try {
      // Inizio caricamento
      setLoading(true);
      
      // Chiamata alla funzione di registrazione dell'auth context
      await register(email, password, displayName);
      
      // Il redirect avviene automaticamente grazie al context
    } catch (error) {
      // Gestione degli errori
      let errorMessage = 'Si è verificato un errore. Riprova più tardi.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Questo indirizzo email è già in uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Indirizzo email non valido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La password è troppo debole';
      }
      
      setError(errorMessage);
      console.error('Errore di registrazione:', error);
    } finally {
      // Fine caricamento
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titolo */}
          <Text style={styles.title}>Crea un Account</Text>
          <Text style={styles.subtitle}>Registrati per iniziare a tracciare i tuoi percorsi</Text>

          {/* Form di registrazione */}
          <View style={styles.formContainer}>
            {/* Messaggio di errore */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Campo Nome Utente */}
            <Input
              label="Nome utente"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Inserisci il tuo nome utente"
              autoCapitalize="words"
              iconName="person-outline"
            />

            {/* Campo Email */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Inserisci la tua email"
              keyboardType="email-address"
              autoComplete="email"
              iconName="mail-outline"
            />

            {/* Campo Password */}
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Crea una password"
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {/* Campo Conferma Password */}
            <Input
              label="Conferma Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Conferma la tua password"
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {/* Pulsante Registrazione */}
            <Button
              title="Registrati"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            {/* Link al login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>
                Hai già un account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Accedi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppConfig.theme.dark.primary,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppConfig.theme.dark.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppConfig.theme.dark.error,
  },
  errorText: {
    color: AppConfig.theme.dark.error,
    fontSize: 14,
  },
  registerButton: {
    marginTop: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: AppConfig.theme.dark.textSecondary,
    marginRight: 4,
  },
  loginLink: {
    color: AppConfig.theme.dark.accent,
    fontWeight: '600',
  },
});

export default RegisterScreen; 