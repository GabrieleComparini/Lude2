import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/Map/MapScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AppConfig from '../config/app.js';

const Tab = createBottomTabNavigator();

// Configurazione del navigatore principale dell'app con Tab Bar
const AppNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={{
        tabBarActiveTintColor: AppConfig.theme.dark.accent,
        tabBarInactiveTintColor: AppConfig.theme.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: AppConfig.theme.dark.secondary,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerStyle: {
          backgroundColor: AppConfig.theme.dark.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: AppConfig.theme.dark.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Mappa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Cerca',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'Esplora',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profilo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator; 