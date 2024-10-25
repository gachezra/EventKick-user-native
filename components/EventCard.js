import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { favoriteEventRoute, shareTrackingRoute, getForumThreadsRoute } from '../utils/APIRoutes';
import axios from 'axios';
import ThreadCount from './ThreadCount';
import EventMediaCount from './EventMediaCount';

const EventCard = ({ event, onPress, userId, token, fullWidth = false }) => {
  const [imageHeight, setImageHeight] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [likes, setLikes] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const eventId = event._id;

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = fullWidth ? screenWidth * 0.95 : screenWidth * 0.84;

  useEffect(() => {
    if (event.image) {
      Image.getSize(event.image, (width, height) => {
        const imageWidth = cardWidth - 32;
        const scaleFactor = imageWidth / width;
        setImageHeight(height * scaleFactor);
      }, (error) => {
        console.error("Couldn't get the image size:", error);
      });
    }

    setIsRegistered(
      event.registeredUsers.some(registeredUser => registeredUser.user.toString() === userId)
    );
    setFavorite(event.favouritedByUser.includes(userId));
    setLikes(event.favouritedByUser.length);

  }, [event, cardWidth, userId]);

  const handleFavorite = async () => {
    try {
      const res = await axios.post(favoriteEventRoute(event._id), {
        userId
      }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      
      if (res.status === 200) {
        setLikes(res.data.favoritedCount);
        setFavorite(!favorite);
      }
    } catch (e) {
      console.error('Error liking the post: ', e.response?.data || e.message);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message:
          `Check out this amazing event on EventKick! https://eventkick.ke/events/${event._id}`,
      });

      if (result.action === Share.sharedAction) {
        await axios.post(shareTrackingRoute(event._id), { platform: 'whatsapp' });
      }
    } catch (error) {
      console.error(error.response.data.message);
    }
  }

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={{ position: 'relative', width: '100%', height: imageHeight }}>
        <Image
          source={{ uri: event.image }}
          style={{ ...StyleSheet.absoluteFillObject, opacity: 0.5 }}
          blurRadius={10}
        />
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.image }}
            style={styles.mainImage}
            resizeMode="stretch"
          />
        </View>
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={1} onPress={handleFavorite}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? 'red' : 'white'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} activeOpacity={1} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
        {isRegistered ? (
          <ThreadCount eventId={eventId} token={token} eventTitle={event.title} />
        ) : ''}
        <EventMediaCount eventId={eventId} eventTitle={event.title} />
      </View>
      <TouchableOpacity onPress={onPress} activeOpacity={1}>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{event.title}</Text>
          </View>
          <Text style={styles.location}>{event.location}</Text>
          <Text style={styles.date}>
            {new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'UTC'
            }).format(new Date(event.date))}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="heart" size={20} color="#cccccc" />
              <Text style={styles.statText}>{likes}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={20} color="#cccccc" />
              <Text style={styles.statText}>{event.registeredUsers.length}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f1f3c',
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '80%',
    height: '95%',
    borderRadius: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  menu: {
    position: 'absolute',
    top: 40,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 5,
    padding: 5,
    zIndex: 1,
  },
  menuItem: {
    padding: 10,
  },
  menuText: {
    color: '#ffffff',
    fontSize: 14,
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  location: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 4,
  },
});

export default EventCard;