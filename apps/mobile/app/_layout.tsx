import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import AppConfig from '../src/config/app';

// Componente che gestisce il routing condizionale
function RootLayoutNav() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);

  useEffect(() => {
    if (!auth.loading) {
      setIsAuthHydrated(true);
      
      if (auth.user) {
        if (pathname === '/auth/login' || pathname === '/auth/register') {
          console.log(`RootLayoutNav: Utente autenticato. Path: ${pathname}. Redirect a /(tabs)`);
          router.replace('/(tabs)');
        }
      } else {
        if (pathname !== '/auth/login' && pathname !== '/auth/register') {
          console.log(`RootLayoutNav: Nessun utente. Path: ${pathname}. Redirect a /auth/login`);
          router.replace('/auth/login');
        }
      }
    }
  }, [auth.loading, auth.user, router, pathname]);

  if (auth.loading || !isAuthHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppConfig.theme.dark.accent} />
        <Text style={styles.loadingText}>Controllo autenticazione...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Layout principale
export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Errore caricamento font:', fontError);
    }
  }, [fontError]);

  if (!loaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppConfig.theme.dark.primary,
    padding: 20,
  },
  loadingText: {
    color: AppConfig.theme.dark.text,
    marginTop: 10,
    fontSize: 16,
  },
});
