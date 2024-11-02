import { Text, StyleSheet, View, Alert, SafeAreaView, StatusBar } from 'react-native';
import React, { useEffect, useState, useContext, useRef } from 'react';
import ProgressBar from 'react-native-progress/Bar';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import axios from 'axios';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const OnboardLoading = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [progressValue, setProgressValue] = useState(0);
  const animation = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Permission hooks
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // Function to check if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  };

  const requestPermissions = async () => {
    try {
      // Request camera permissions using hooks
      const cameraResult = await requestCameraPermission();
      const microphoneResult = await requestMicrophonePermission();
      
      // Request media library permissions
      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      const mediaLibrarySaveResult = await MediaLibrary.requestPermissionsAsync(true);

      // Check if all permissions were granted
      const allPermissionsGranted = 
        cameraResult.granted &&
        microphoneResult.granted &&
        mediaLibraryResult.status === 'granted' &&
        mediaLibrarySaveResult.status === 'granted';

      if (!allPermissionsGranted) {
        Alert.alert(
          'Permissions Required',
          'This app requires camera, microphone, and media library permissions to function properly. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }

      setPermissionsGranted(allPermissionsGranted);
      return allPermissionsGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionsGranted(false);
      return false;
    }
  };

  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('Not all permissions were granted');
      }
    };

    checkAndRequestPermissions();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(getApprovedEventsRoute);
        
        // Filter for today's events only
        const todayEvents = res.data.filter(event => isToday(event.date))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setEvents(todayEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let timeoutId;
    
    const updateProgress = () => {
      if (progressValue < 1) {
        timeoutId = setTimeout(() => {
          // More controlled progress increment
          setProgressValue(prev => Math.min(prev + 0.2, 1));
        }, 1500);
      } else {
        // Navigation logic
        if (token) {
          navigation.replace('HomeTab');
        } else {
          navigation.replace('login');
        }
      }
    };

    updateProgress();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [progressValue, token, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <StatusBar barStyle="light-content" backgroundColor="#131324" />
        <Text style={styles.logoText}>EventKick</Text>
        <LottieView
          autoPlay
          loop={false}
          ref={animation}
          style={{
            width: 300,
            height: 300,
            backgroundColor: 'transparent',
          }}
          source={require('../assets/welcome.json')}
        />
        <Text style={[styles.eventText, loading && styles.loadingText]}>
          {error ? 'Unable to load events' :
           loading ? 'Loading events...' :
           `You have ${events.length} event${events.length !== 1 ? 's' : ''} near you today`}
        </Text>
      </View>
      <View style={styles.progress}>
        <ProgressBar
          progress={progressValue}
          borderRadius={3}
          width={200}
          color={'rgba(255, 255, 255, 0.5)'}
        />
      </View>
    </SafeAreaView>
  );
};

export default OnboardLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  logo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
  },
  progress: {
    marginBottom: 70,
    flex: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  eventText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white',
  },
  loadingText: {
    fontSize: 20,
  },
});