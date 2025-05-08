import React, { useState } from 'react';
import LoginScreen from '../../src/screens/Auth/LoginScreen';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Login() {
  const router = useRouter();
  const auth = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  
  // Crea un oggetto navigation compatibile con React Navigation
  const navigation = {
    navigate: (routeName: string) => {
      if (routeName === 'Register') {
        router.push('/auth/register');
      } else if (routeName === 'Main') {
        router.push('/(tabs)');
      } else {
        router.push(routeName);
      }
    },
    goBack: () => router.back()
  };

  // Componente di debug che si sovrappone alla schermata di login
  const DebugOverlay = () => (
    showDebug && (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Modalità Sviluppo</Text>
        
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => {
            // Naviga direttamente alla dashboard senza autenticazione
            router.push('/(tabs)');
          }}
        >
          <Text style={styles.debugButtonText}>Accedi direttamente</Text>
        </TouchableOpacity>
        
        <Text style={styles.debugInfo}>
          {auth?.error ? `Errore: ${auth.error}` : ''}
        </Text>
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setShowDebug(false)}
        >
          <Text style={styles.closeButtonText}>Chiudi</Text>
        </TouchableOpacity>
      </View>
    )
  );
  
  return (
    <>
      <LoginScreen navigation={navigation} />
      <DebugOverlay />
      
      {/* Pulsante discreto per attivare il debug */}
      {!showDebug && (
        <TouchableOpacity 
          style={styles.debugToggle}
          onPress={() => setShowDebug(true)}
        >
          <Text style={styles.debugToggleText}>D</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  debugTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  debugButton: {
    backgroundColor: '#ff9900',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 8
  },
  debugButtonText: {
    color: 'black',
    fontWeight: 'bold'
  },
  debugInfo: {
    color: '#ff5555',
    fontSize: 12,
    marginTop: 8
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#555',
    borderRadius: 5
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12
  },
  debugToggle: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(100,100,100,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  debugToggleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  }
}); 