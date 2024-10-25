import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SvgXml } from 'react-native-svg';
import { Heart, Ticket } from 'lucide-react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import RBSheet from "react-native-raw-bottom-sheet";
import QRCode from 'react-native-qrcode-svg';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('calendar');
  const [ticket, setTicket] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomSheetRef = useRef();

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(getApprovedEventsRoute, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedEvents = response.data;

      const regEvents = fetchedEvents.filter(event => 
        event.registeredUsers.some(ru => ru.user === user._id)
      );
    
      const favEvents = fetchedEvents.filter(event => 
        event.favouritedByUser.includes(user._id)
      );

      setRegisteredEvents(regEvents);
      setFavoriteEvents(favEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user._id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePress = (event) => {
    if (activeTab === 'calendar') {
      if (event.isPaid) {
        setTicket(`${event._id}_${user._id}`)
        bottomSheetRef.current.open();
      } else {
        navigation.navigate('EventDetails', {event})
      }
    } else {
      navigation.navigate('EventDetails', {event})
    }
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: () => logout(),
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    await fetchEvents();
    setRefreshing(false);
    setLoading(false);
  }, [fetchEvents]);

  const renderEventCard = ({ item }) => (
    <EventCard userId={user._id} event={item} token={token} onPress={() => handlePress(item)} fullWidth={true} />
  );

  const renderHeader = () => (
    <>
    <View style={styles.header}>
      <SvgXml xml={atob(user.avatarImage)} width={80} height={80} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.bio}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={{marginTop: 45, height: 30, width: 30, borderRadius: 15, borderColor: 'white', borderWidth: 1, justifyContent: 'center', alignItems: 'center'}} 
        onPress={() => navigation.navigate('EditProfile')}
        >
        <FontAwesome6 name='pen-to-square' size={15} color='white' />
      </TouchableOpacity>
      <TouchableOpacity
        style={{position: 'absolute', top: 10, right: 20, height: 30, width: 30, borderRadius: 15, borderColor: 'white', borderWidth: 1, justifyContent: 'center', alignItems: 'center'}}
        onPress={handleLogout}
        >
        <Ionicons name='log-out-outline' size={20} color='white' />
      </TouchableOpacity>
    </View>
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
        onPress={() => setActiveTab('calendar')}
        activeOpacity={1}
      >
        <Ticket color={activeTab === 'calendar' ? '#ffffff' : '#a0a0a0'} size={20} />
        <Text style={{color: activeTab === 'calendar' ? '#ffffff' : '#a0a0a0'}}>{registeredEvents.length}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
        onPress={() => setActiveTab('favorites')}
        activeOpacity={1}
      >
        <Heart color={activeTab === 'favorites' ? '#ffffff' : '#a0a0a0'} size={20} />
        <Text style={{color: activeTab === 'favorites' ? '#ffffff' : '#a0a0a0'}}>{favoriteEvents.length}</Text>
      </TouchableOpacity>
    </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={activeTab === 'calendar' ? registeredEvents : favoriteEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
          </View>
        ) : (
          <Text style={styles.emptyText}>No events to display</Text>
        )}
      />
      <RBSheet
        ref={bottomSheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={400}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)"
          },
          container: {
            backgroundColor: '#1F2937',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: {
            backgroundColor: "#fff"
          }
        }}
      >
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center',}}>
          <Text style={{fontSize: 15, fontWeight: 'bold', marginBottom: 50, color: 'white'}}>Scan the QR Code</Text>
          <QRCode
            value={ticket}
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>
      </RBSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  loaderContainer: {
    flex: 1,
    marginTop: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131324',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    marginTop: 5
  },
  avatar: {
    borderRadius: 40,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bio: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 5,
  },
  logoutText: {
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1e1e36',
    marginBottom: 10
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  activeTab: {
    backgroundColor: '#1e1e36',
  },
  emptyText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProfileScreen;