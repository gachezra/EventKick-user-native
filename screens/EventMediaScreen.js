import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView, StatusBar, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import AWS from 'aws-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { getApprovedEventsRoute } from '../utils/APIRoutes';

const { width: windowWidth } = Dimensions.get('window');
const albumSize = windowWidth / 2 - 10;

const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
});

const EventMediaScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [eventMedia, setEventMedia] = useState({});
  const [cachedMedia, setCachedMedia] = useState({});

  useEffect(() => {
    fetchRegisteredEvents();
    loadCachedMedia();
  }, []);

  const fetchRegisteredEvents = async () => {
    try {
      const response = await axios.get(getApprovedEventsRoute, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allEvents = response.data;

      const filteredEvents = allEvents.filter(event =>
        event.registeredUsers &&
        event.registeredUsers.some(registeredUser => 
          registeredUser.user && registeredUser.user.toString() === user._id
        )
      );

      setRegisteredEvents(filteredEvents);
      filteredEvents.forEach(event => loadEventMedia(event));
    } catch (err) {
      console.error("Error fetching registered events:", err.response);
    }
  };

  const loadEventMedia = async (event) => {
    const params = {
      Bucket: 'eventkick',
      Prefix: `eventkick/${event._id}/`,
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      if (data.Contents.length > 0) {
        // Filter out invalid items where the key ends with '/'
        const eventMediaList = data.Contents
          .filter(item => !item.Key.endsWith('/'))  // Remove directory-like items
          .map(item => ({
            uri: `https://s3.tebi.io/eventkick/${item.Key}`,
            type: item.Key.toLowerCase().endsWith('.mp4') ? 'video' : 'photo',
            eventId: event._id,
            key: item.Key,
            isCached: false
          }));
      
        // Set the filtered media to state
        setEventMedia(prevMedia => ({
          ...prevMedia,
          [event._id]: eventMediaList
        }));
      
        // Cache each file
        eventMediaList.forEach(item => cacheFile(item));
      }
      
    } catch (error) {
      console.error(`Error fetching media for event ${event._id}:`, error);
    }
  };

  const cacheFile = async (item) => {
    const { uri, key } = item;
    const fileName = key.split('/').pop();
    const directory = `${FileSystem.documentDirectory}eventkick/`;
    const fileUri = `${directory}${fileName}`;
    
    try {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        const { uri: cachedUri } = await FileSystem.downloadAsync(uri, fileUri);
        
        setCachedMedia(prev => ({
          ...prev,
          [key]: cachedUri
        }));

        setEventMedia(prevMedia => ({
          ...prevMedia,
          [item.eventId]: prevMedia[item.eventId].map(mediaItem => 
            mediaItem.key === key ? { ...mediaItem, isCached: true, uri: cachedUri } : mediaItem
          )
        }));
      } else {
        setCachedMedia(prev => ({
          ...prev,
          [key]: fileUri
        }));

        setEventMedia(prevMedia => ({
          ...prevMedia,
          [item.eventId]: prevMedia[item.eventId].map(mediaItem => 
            mediaItem.key === key ? { ...mediaItem, isCached: true, uri: fileUri } : mediaItem
          )
        }));
      }
    } catch (error) {
      console.error('Error caching file:', error);
    }
  };

  const loadCachedMedia = async () => {
    try {
      const cachedMediaJSON = await AsyncStorage.getItem('cachedMedia');
      if (cachedMediaJSON) {
        setCachedMedia(JSON.parse(cachedMediaJSON));
      }
    } catch (error) {
      console.error('Error loading cached media:', error);
    }
  };

  const saveCachedMedia = async (newCachedMedia) => {
    try {
      await AsyncStorage.setItem('cachedMedia', JSON.stringify(newCachedMedia));
    } catch (error) {
      console.error('Error saving cached media:', error);
    }
  };

  useEffect(() => {
    saveCachedMedia(cachedMedia);
  }, [cachedMedia]);

  const renderAlbum = useCallback(({ item }) => {
    const media = eventMedia[item._id] || [];
    if (media.length === 0) {
      return null;
    }

    const coverMedia = media[0];

    return (
      <View style={styles.albumContainer}>
        <TouchableOpacity 
          style={styles.album}
          onPress={() => navigation.navigate('Reels', { allMedia: media, eventTitle: item.title, eventId: item._id })}
        >
          {coverMedia ? (
            coverMedia.isCached ? (
              coverMedia.type === 'video' ? (
                <Video
                  source={{ uri: coverMedia.uri }}
                  style={styles.albumCover}
                  resizeMode="cover"
                  shouldPlay={false}
                  isMuted={true}
                  positionMillis={1000}
                />
              ) : (
                <Image source={{ uri: coverMedia.uri }} style={styles.albumCover} />
              )
            ) : (
              <View style={[styles.albumCover, styles.loadingAlbum]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )
          ) : (
            <View style={[styles.albumCover, styles.emptyAlbum]}>
              <Text style={styles.emptyAlbumText}>No media</Text>
            </View>
          )}
          <Text style={styles.albumTitle}>{item.title}</Text>
          <Text style={styles.mediaCount}>{media.length} items</Text>
        </TouchableOpacity>
      </View>
    );
  }, [eventMedia]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Text style={styles.title}>Event Media</Text>
        <FlatList
          data={registeredEvents}
          renderItem={renderAlbum}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.albumGrid}
          ListEmptyComponent={<Text style={styles.emptyText}>No events with media found</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131324',
  },
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 15,
    marginHorizontal: 20,
    color: '#fff',
  },
  albumGrid: {
    padding: 5,
  },
  albumContainer: {
    width: albumSize,
    marginBottom: 20,
    marginHorizontal: 5,
  },
  album: {
    width: '100%',
  },
  albumCover: {
    width: '95%',
    height: albumSize,
    borderRadius: 10,
    marginBottom: 8,
  },
  loadingAlbum: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAlbum: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAlbumText: {
    color: '#888',
    fontSize: 16,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mediaCount: {
    color: '#888',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 30,
  },
});

export default EventMediaScreen;