import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import AppConfig from '../config/app.js';

const Stack = createStackNavigator();

// Configurazione dello stack di navigazione per l'autenticazione
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: AppConfig.theme.dark.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: AppConfig.theme.dark.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: AppConfig.theme.dark.primary,
        }
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Accedi' }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Registrati' }} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 