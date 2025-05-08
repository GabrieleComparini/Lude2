import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppConfig from '../../config/app';

// Schermata temporanea per la Ricerca
// Verrà implementata completamente nella Fase 5
const SearchScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ricerca</Text>
        <Text style={styles.subtitle}>
          Questa schermata verrà implementata nella Fase 5.
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppConfig.theme.dark.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
  },
});

export default SearchScreen; 