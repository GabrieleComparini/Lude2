import React from 'react';
import RegisterScreen from '../../src/screens/Auth/RegisterScreen';
import { useRouter } from 'expo-router';

export default function Register() {
  const router = useRouter();
  
  // Crea un oggetto navigation compatibile con React Navigation
  const navigation = {
    navigate: (routeName: string) => {
      if (routeName === 'Login') {
        router.push('/auth/login');
      } else if (routeName === 'Main') {
        router.push('/(tabs)');
      } else {
        router.push(routeName);
      }
    },
    goBack: () => router.back()
  };
  
  return <RegisterScreen navigation={navigation} />;
} 