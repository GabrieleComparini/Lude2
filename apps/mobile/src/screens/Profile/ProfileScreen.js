import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AppConfig from '../../config/app';
import Button from '../../components/ui/Button';

// Schermata temporanea per il Profilo
// Verrà implementata completamente nella Fase 4
const ProfileScreen = () => {
  const { user, logout } = useAuth();

  // Funzione di logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Avatar e informazioni utente */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color={AppConfig.theme.dark.text} />
          </View>
          <Text style={styles.username}>{user?.displayName || 'Utente'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        </View>

        <Text style={styles.subtitle}>
          La schermata profilo completa verrà implementata nella Fase 4.
        </Text>

        {/* Pulsante logout */}
        <Button 
          title="Logout" 
          onPress={handleLogout} 
          variant="outline"
          style={styles.logoutButton} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.theme.dark.primary,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppConfig.theme.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppConfig.theme.dark.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    marginTop: 'auto',
    width: '100%',
  },
});

export default ProfileScreen; 