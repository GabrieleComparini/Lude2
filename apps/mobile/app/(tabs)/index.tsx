import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppConfig from '../../src/config/app';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null; // Metri al secondo
  altitude?: number | null;
  accuracy?: number | null;
}

export default function MapScreen() {
  const [currentRegion, setCurrentRegion] = useState<Region | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | undefined>(undefined);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<TrackPoint[]>([]);
  const [currentTrackStartTime, setCurrentTrackStartTime] = useState<number | null>(null);
  const [trackDuration, setTrackDuration] = useState(0); // In secondi

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView>(null); // Riferimento alla mappa

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permesso di accedere alla posizione negato.');
        Alert.alert(
          'Permesso Negato',
          "Per utilizzare la mappa, è necessario concedere l'accesso alla posizione. Vai alle impostazioni per abilitarlo.",
          [
            { text: "Annulla", style: "cancel" },
            { text: "Apri Impostazioni", onPress: () => Linking.openSettings() }
          ]
        );
        setPermissionGranted(false);
        return;
      }
      setPermissionGranted(true);

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High, 
        });
        setUserLocation(location.coords);
        setCurrentRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
        setLocationErrorMsg(null);
      } catch (error: any) {
        console.warn("Errore getCurrentPositionAsync (High Accuracy):", error);
        try {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation(location.coords);
          setCurrentRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          mapRef.current?.animateToRegion(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
          setLocationErrorMsg(null);
        } catch (fallbackError: any) {
          console.error("Errore getCurrentPositionAsync (Balanced Fallback):", fallbackError);
          setLocationErrorMsg('Impossibile ottenere la posizione attuale dopo fallback.');
          Alert.alert("Errore Posizione", "Non è stato possibile determinare la tua posizione attuale. Assicurati che il GPS sia attivo e riprova.");
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (isTracking && currentTrackStartTime) {
      timerIntervalRef.current = setInterval(() => {
        setTrackDuration(Math.floor((Date.now() - currentTrackStartTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTracking, currentTrackStartTime]);

  const handleStartTracking = async () => {
    if (!permissionGranted) {
      Alert.alert("Permesso Mancante", "È necessario il permesso di localizzazione per avviare il tracciamento.");
      return;
    }
    console.log("Avvio tracciamento...");
    setIsTracking(true);
    setRouteCoordinates([]);
    setTrackDuration(0);
    const startTime = Date.now();
    setCurrentTrackStartTime(startTime);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (location) => {
        const newPoint: TrackPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
        };
        setRouteCoordinates((prevCoords) => [...prevCoords, newPoint]);
        setUserLocation(location.coords);
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: currentRegion?.latitudeDelta || 0.01,
            longitudeDelta: currentRegion?.longitudeDelta || 0.01,
          },
          500
        );
      }
    );
  };

  const handleStopTracking = () => {
    console.log("Fermo tracciamento...");
    setIsTracking(false);
    setCurrentTrackStartTime(null);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (routeCoordinates.length > 1) {
      Alert.alert("Tracciato Fermato", `Durata: ${formatDuration(trackDuration)}. Punti registrati: ${routeCoordinates.length}`);
    }
  };
  
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ': ''}${minutes > 0 ? minutes + 'm ': ''}${seconds}s`;
  };

  const renderHeaderIcons = () => (
    <View style={styles.headerButtonsContainer}>
      <Ionicons name="person-circle-outline" size={32} color={AppConfig.theme.dark.text} style={styles.headerIcon} /> 
      <Ionicons name="settings-outline" size={30} color={AppConfig.theme.dark.text} style={styles.headerIcon} />
    </View>
  );

  const renderTrackingInfo = () => {
    if (!isTracking && trackDuration === 0) return null;
    return (
      <View style={styles.trackingInfoContainer}>
        {isTracking ? (
            <Text style={styles.trackingInfoText}>In Tracciamento: {formatDuration(trackDuration)}</Text>
        ) : (
            <Text style={styles.trackingInfoText}>Ultimo Tracciato: {formatDuration(trackDuration)} - {routeCoordinates.length} punti</Text>
        )}
      </View>
    );
  }

  const renderTrackingButton = () => (
    <View style={styles.trackingButtonContainer}>
      <TouchableOpacity 
        style={[styles.trackingButton, isTracking ? styles.trackingButtonStop : styles.trackingButtonStart]}
        onPress={isTracking ? handleStopTracking : handleStartTracking}
      >
        <Text style={styles.trackingButtonText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (locationErrorMsg && !permissionGranted) {
    return (
      <SafeAreaView style={styles.containerCentered}>
        {renderHeaderIcons()}
        <Text style={styles.errorText}>{locationErrorMsg}</Text>
        <Text style={styles.message}>Abilita i permessi di localizzazione nelle impostazioni per usare la mappa.</Text>
      </SafeAreaView>
    );
  }
  
  if (!currentRegion && !locationErrorMsg) {
    return (
      <SafeAreaView style={styles.containerCentered}>
        {renderHeaderIcons()}
        <ActivityIndicator size="large" color={AppConfig.theme.dark.accent} />
        <Text style={styles.message}>Caricamento mappa e posizione...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeaderIcons()}
      <MapView 
        ref={mapRef}
        style={styles.map}
        region={currentRegion} 
        initialRegion={!currentRegion && permissionGranted ? {
          latitude: 41.9028,
          longitude: 12.4964,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        } : undefined}
        showsUserLocation={permissionGranted}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {userLocation && permissionGranted && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="La tua Posizione"
            pinColor={AppConfig.theme.dark.accent}
          />
        )}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates.map(p => ({latitude: p.latitude, longitude: p.longitude}))}
            strokeColor={AppConfig.theme.dark.accent} 
            strokeWidth={4} 
          />
        )}
      </MapView>
      {renderTrackingInfo()}
      {renderTrackingButton()}
      {locationErrorMsg && permissionGranted && (
          <View style={styles.inlineErrorContainer}>
              <Text style={styles.inlineErrorText}>{locationErrorMsg}</Text>
          </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.theme.dark.primary,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: AppConfig.theme.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  map: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: AppConfig.theme.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: AppConfig.theme.dark.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  headerButtonsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30, 
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10, 
    paddingHorizontal: 5,
  },
  headerIcon: {},
  trackingInfoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 10,
    alignItems: 'center',
  },
  trackingInfoText: {
    color: 'white',
    fontSize: 12,
  },
  trackingButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  trackingButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
    alignItems: 'center',
  },
  trackingButtonStart: {
    backgroundColor: AppConfig.theme.dark.accent,
  },
  trackingButtonStop: {
    backgroundColor: AppConfig.theme.dark.error,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inlineErrorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  inlineErrorText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  }
});
