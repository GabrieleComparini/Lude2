import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AppConfig from '../../config/app';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  // Stati per i dati del form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook per l'accesso alle funzioni di autenticazione
  const { login } = useAuth();

  // Gestione del login
  const handleLogin = async () => {
    // Reset degli errori
    setError(null);
    
    // Validazione base dei campi
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    
    try {
      // Inizio caricamento
      setLoading(true);
      
      // Chiamata alla funzione di login dell'auth context
      await login(email, password);
      
      // Il redirect avviene automaticamente grazie al context
    } catch (error) {
      // Gestione degli errori
      setError(
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'Email o password non validi'
          : 'Si è verificato un errore. Riprova più tardi.'
      );
      console.error('Errore di login:', error);
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
          {/* Header e Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="map-outline" size={80} color={AppConfig.theme.dark.accent} />
            </View>
            <Text style={styles.title}>Lude</Text>
            <Text style={styles.subtitle}>Il tuo compagno di viaggio</Text>
          </View>

          {/* Form di login */}
          <View style={styles.formContainer}>
            {/* Messaggio di errore */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
              placeholder="Inserisci la tua password"
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {/* Pulsante Login */}
            <Button
              title="Accedi"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* Link alla registrazione */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>
                Non hai un account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Registrati</Text>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppConfig.theme.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppConfig.theme.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
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
  loginButton: {
    marginTop: 8,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: AppConfig.theme.dark.textSecondary,
    marginRight: 4,
  },
  registerLink: {
    color: AppConfig.theme.dark.accent,
    fontWeight: '600',
  },
});

export default LoginScreen; 