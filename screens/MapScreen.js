import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';

const LocationIQ_API_KEY = 'pk.9e8aa96350a96ba37e55edc98c3f109c';

// Added more specific location data for better geocoding results
const eventData = [
  {
    title: 'Tech Conference 2024',
    location: 'Tapas Cielo, Links Road, Nyali, Mombasa, Kenya',
    poster: 'https://via.placeholder.com/150',
    date: '2024-12-05',
  },
  {
    title: 'Art Fair',
    location: 'Mamba Village Centre, Mombasa, Kenya',
    poster: 'https://via.placeholder.com/150',
    date: '2024-12-10',
  },
  {
    title: 'Food Festival',
    location: 'City Mall Nyali, Links Road, Mombasa, Kenya',
    poster: 'https://via.placeholder.com/150',
    date: '2024-12-20',
  },
];

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchAnimation = useState(new Animated.Value(-100))[0];

  // Debug log function
  const debugLog = (message, data = null) => {
    console.log(`[DEBUG] ${message}`, data || '');
  };

  useEffect(() => {
    const getUserLocation = async () => {
      debugLog('Requesting location permissions');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          debugLog('Location permission denied');
          Alert.alert('Permission Denied', 'Location permission is required to use this app.');
          return;
        }

        debugLog('Getting current position');
        const location = await Location.getCurrentPositionAsync({});
        debugLog('Current position received:', location);

        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(userCoords);
        setRegion({
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        
        debugLog('User location set:', userCoords);
      } catch (error) {
        debugLog('Error getting location:', error);
        Alert.alert('Location Error', 'Failed to get your location. Please check your device settings.');
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    const filterEvents = () => {
      debugLog('Filtering events for date:', selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const filteredEvents = eventData.filter(event => event.date === formattedDate);
      setEvents(filteredEvents);
      debugLog('Filtered events:', filteredEvents);

      if (filteredEvents.length > 0) {
        fetchEventCoordinates(filteredEvents);
      } else {
        debugLog('No events found for selected date');
        setMarkers([]);
      }
    };

    filterEvents();
  }, [selectedDate]);

  const fetchEventCoordinates = async (events) => {
    setIsLoading(true);
    debugLog('Fetching coordinates for events:', events);

    try {
      const newMarkers = await Promise.all(
        events.map(async (event) => {
          debugLog('Geocoding location:', event.location);
          
          try {
            const response = await axios.get(
              `https://us1.locationiq.com/v1/search.php?key=${LocationIQ_API_KEY}&q=${encodeURIComponent(
                event.location
              )}&format=json`
            );

            debugLog('LocationIQ response:', response.data);

            if (!response.data || response.data.length === 0) {
              debugLog('No coordinates found for location:', event.location);
              return null;
            }

            const { lat, lon } = response.data[0];
            const coordinates = {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
            };

            debugLog('Coordinates found:', coordinates);

            return {
              title: event.title,
              coordinates,
              poster: event.poster,
            };
          } catch (error) {
            debugLog('Error geocoding individual location:', error);
            return null;
          }
        })
      );

      // Filter out any null markers from failed geocoding
      const validMarkers = newMarkers.filter(marker => marker !== null);
      debugLog('Valid markers:', validMarkers);
      setMarkers(validMarkers);

      // If we have valid markers, update the region to show all markers
      if (validMarkers.length > 0) {
        const newRegion = calculateRegionForMarkers(validMarkers);
        setRegion(newRegion);
        debugLog('Updated region:', newRegion);
      }
    } catch (error) {
      debugLog('Error in fetchEventCoordinates:', error);
      Alert.alert('Error', 'Failed to fetch event locations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRegionForMarkers = (markers) => {
    if (markers.length === 0) return null;

    let minLat = markers[0].coordinates.latitude;
    let maxLat = markers[0].coordinates.latitude;
    let minLng = markers[0].coordinates.longitude;
    let maxLng = markers[0].coordinates.longitude;

    markers.forEach(marker => {
      minLat = Math.min(minLat, marker.coordinates.latitude);
      maxLat = Math.max(maxLat, marker.coordinates.latitude);
      minLng = Math.min(minLng, marker.coordinates.longitude);
      maxLng = Math.max(maxLng, marker.coordinates.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add some padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    };
  };

  const centerMapOnUser = () => {
    if (userLocation) {
      debugLog('Centering map on user location:', userLocation);
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      debugLog('Cannot center map: user location not available');
    }
  };

  const toggleSearch = () => {
    Animated.timing(searchAnimation, {
      toValue: searchVisible ? -100 : 45,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSearchVisible(!searchVisible);
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinate={marker.coordinates}
              title={marker.title}
            >
              <View style={styles.markerContainer}>
                <Image source={{ uri: marker.poster }} style={styles.markerImage} />
                <Text style={styles.markerText}>{marker.title}</Text>
              </View>
            </Marker>
          ))}
          {userLocation && (
            <Marker coordinate={userLocation}>
              <View style={styles.userMarker}>
                <View style={styles.innerCircle} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.calendarButton} onPress={() => setModalVisible(true)}>
        <FontAwesome5 name="calendar-alt" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.locationButton} onPress={centerMapOnUser}>
        <FontAwesome5 name="location-arrow" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
        <Feather name="search" size={24} color="#fff" />
      </TouchableOpacity>

      <Animated.View style={[styles.searchBar, { top: searchAnimation }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          placeholderTextColor="#aaa"
        />
      </Animated.View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                if (date) {
                  debugLog('New date selected:', date);
                  setSelectedDate(date);
                }
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e36',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  calendarButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#131324',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#131324',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  searchButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#131324',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 70,
    backgroundColor: '#131324',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#131324',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: '#1e1e36',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a84ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default App;