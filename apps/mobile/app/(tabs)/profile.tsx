import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import AppConfig from '../../src/config/app';

export default function ProfileScreen() {
  const auth = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      Alert.alert(
        "Logout",
        "Sei sicuro di voler uscire?",
        [
          {
            text: "Annulla",
            style: "cancel"
          },
          { 
            text: "Conferma", 
            onPress: async () => {
              await auth.logout();
              // La redirezione avviene automaticamente tramite _layout.tsx
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Errore", "Si è verificato un errore durante il logout.");
    }
  };

  if (!auth.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>Utente non autenticato</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profilo</Text>
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{auth.user.email}</Text>
          
          {auth.user.displayName && (
            <>
              <Text style={styles.label}>Nome:</Text>
              <Text style={styles.value}>{auth.user.displayName}</Text>
            </>
          )}
          
          <Text style={styles.label}>ID Utente:</Text>
          <Text style={styles.value}>{auth.user.uid}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.theme.dark.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppConfig.theme.dark.text,
    marginBottom: 32,
  },
  profileInfo: {
    width: '100%',
    backgroundColor: AppConfig.theme.dark.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: AppConfig.theme.dark.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: AppConfig.theme.dark.text,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: AppConfig.theme.dark.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 