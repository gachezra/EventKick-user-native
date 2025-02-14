import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Changed import
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import debounce from 'lodash/debounce';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao'; // Replace with your API key

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
    title: 'Art Flair',
    location: 'Kusini Tavern, Malindi',
    poster: 'https://via.placeholder.com/150',
    date: '2024-12-10',
  },
  {
    title: 'Art Flambe',
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

// Pulsating Marker Component remains the same
const PulsatingMarker = ({ coordinate, title, poster, onPress }) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      onPress={() => onPress({ coordinate, title, poster })}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          {
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        <View style={styles.markerImageContainer}>
          <Image source={{ uri: poster }} style={styles.markerImage} />
          <View style={styles.pulseCircle} />
        </View>
        <Text style={styles.markerText}>{title}</Text>
      </Animated.View>
    </Marker>
  );
};

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const searchAnimation = useState(new Animated.Value(-100))[0];

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const debouncedSearch = useRef(
    debounce(async (text) => {
      if (text.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            text
          )}&key=${GOOGLE_MAPS_API_KEY}&components=country:ke`

        );
        console.log('Maps data: ', response)

        if (response.data.predictions) {
          const predictions = response.data.predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
          }));
          setSearchResults(predictions);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      }
    }, 300)
  ).current;

  const handleSearchInput = (text) => {
    console.log('handling...');
    setSearchText(text);
    debouncedSearch(text);
  };

  const handlePlaceSelect = async (placeId, description) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.result) {
        const { location } = response.data.result.geometry;
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        
        setRegion(newRegion);
        setSearchText(description);
        setShowSearchResults(false);
        setSearchVisible(false);
        
        // Filter events near the selected location
        const nearbyEvents = await findNearbyEvents(location.lat, location.lng);
        setMarkers(nearbyEvents);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const findNearbyEvents = async (latitude, longitude) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const filteredEvents = eventData.filter(event => event.date === formattedDate);
    
    try {
      const eventsWithCoords = await Promise.all(
        filteredEvents.map(async (event) => {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              event.location
            )}&key=${GOOGLE_MAPS_API_KEY}`
          );

          if (response.data.results[0]) {
            const eventLocation = response.data.results[0].geometry.location;
            const distance = calculateDistance(
              latitude,
              longitude,
              eventLocation.lat,
              eventLocation.lng
            );

            return {
              ...event,
              coordinates: {
                latitude: eventLocation.lat,
                longitude: eventLocation.lng,
              },
              distance,
            };
          }
          return null;
        })
      );

      // Filter events within 10km and sort by distance
      return eventsWithCoords
        .filter(event => event && event.distance <= 10)
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby events:', error);
      return [];
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
        const location = await Location.getCurrentPositionAsync({enableHighAccuracy: true});
        debugLog('Current position received:', location);

        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(userCoords);
        setRegion({
          ...userCoords,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
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

  // Updated to use Google Maps Geocoding API
  const fetchEventCoordinates = async (events) => {
    setIsLoading(true);
    debugLog('Fetching coordinates for events:', events);

    try {
      const newMarkers = await Promise.all(
        events.map(async (event) => {
          debugLog('Geocoding location:', event.location);
          
          try {
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                event.location
              )}&key=${GOOGLE_MAPS_API_KEY}`
            );

            debugLog('Google Geocoding response:', response.data);

            if (!response.data || response.data.status !== 'OK') {
              debugLog('No coordinates found for location:', event.location);
              return null;
            }

            const { location } = response.data.results[0].geometry;
            const coordinates = {
              latitude: location.lat,
              longitude: location.lng,
            };

            debugLog('Coordinates found:', coordinates);

            return {
              title: event.title,
              coordinates,
              poster: event.poster,
              location: event.location,
            };
          } catch (error) {
            debugLog('Error geocoding individual location:', error);
            return null;
          }
        })
      );

      const validMarkers = newMarkers.filter(marker => marker !== null);
      debugLog('Valid markers:', validMarkers);
      setMarkers(validMarkers);

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

  // Updated to use Google Maps for directions
  const getDirections = (marker) => {
    if (!userLocation) {
      Alert.alert('Error', 'Your location is not available');
      return;
    }

    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${marker.coordinates.latitude},${marker.coordinates.longitude}`;

    const url = Platform.select({
      ios: `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`,
      android: `google.navigation:q=${destination}`
    });

    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl);
      }
    }).catch(err => {
      debugLog('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
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
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
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
          customMapStyle={mapStyle} // Optional: Add custom map style
        >
          {markers.map((marker, index) => (
            <PulsatingMarker
              key={index}
              coordinate={marker.coordinates}
              title={marker.title}
              poster={marker.poster}
              onPress={(markerDetails) => setSelectedMarker(markerDetails)}
            />
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

      {/* Rest of the UI components remain the same */}
      {selectedMarker && (
        <View style={styles.directionsCard}>
          <Text style={styles.directionsTitle}>{selectedMarker.title}</Text>
          <Text style={styles.directionsLocation}>{selectedMarker.location}</Text>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => getDirections(selectedMarker)}
          >
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeDirectionsButton}
            onPress={() => setSelectedMarker(null)}
          >
            <Text style={styles.closeDirectionsText}>Close</Text>
          </TouchableOpacity>
        </View>
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
          value={searchText}
          onChangeText={handleSearchInput}
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

// Optional: Add custom map style
const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#1d2c4d'
      }
    ]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#8ec3b9'
      }
    ]
  },
  // Add more style elements as needed
];

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
  markerImageContainer: {
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4CAF50',
    opacity: 0.5,
  },
  directionsCard: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: '#131324',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  directionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  directionsLocation: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  directionsButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeDirectionsButton: {
    padding: 5,
    alignItems: 'center',
  },
  closeDirectionsText: {
    color: '#aaa',
    fontSize: 14,
  },
  calendarButton: {
    position: 'absolute',
    bottom:80,
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
    left: 20,
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
    right: 10,
    left: 70,
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