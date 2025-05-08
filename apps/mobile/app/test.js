import { Text, View, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function TestScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagina di Test</Text>
      <Text style={styles.subtitle}>Questa è una pagina di test separata</Text>
      <Button 
        title="Torna alla Home" 
        onPress={() => router.navigate('/')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e74c3c', // Sfondo rosso
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 30,
  }
}); 