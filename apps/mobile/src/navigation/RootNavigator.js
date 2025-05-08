import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import AppConfig from '../config/app.js';

// Navigatore principale che gestisce il flusso di autenticazione
const RootNavigator = () => {
  const { user, loading } = useAuth();

  // Mostra lo splash screen durante il caricamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppConfig.theme.dark.accent} />
      </View>
    );
  }

  // NOTA: Per scopi di test, mostriamo sempre AppNavigator
  // In una versione di produzione, questo sarebbe: return user ? <AppNavigator /> : <AuthNavigator />;
  return <AppNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppConfig.theme.dark.primary,
  },
});

export default RootNavigator; 