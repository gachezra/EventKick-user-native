import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, FlatList, TextInput, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const { user, token } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('New');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigation = useNavigation();

  const dropdownHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(getApprovedEventsRoute);

        const currentDate = new Date();

        const filteredEvents = res.data
          .filter(event => new Date(event.date) >= currentDate)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(filteredEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    sortEvents(sortOption);
  }, [sortOption]);

  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: showSortMenu ? 70 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [showSortMenu]);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query) {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  const sortEvents = (option) => {
    let sortedEvents = [...events];
    if (option === 'Popular') {
      sortedEvents = sortedEvents.sort((a, b) => b.openedCount - a.openedCount);
    } else {
      sortedEvents = sortedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    setEvents(sortedEvents);
  };

  const filteredEventsByType = () => {
    const eventsToFilter = searchQuery ? filteredEvents : events;
    if (activeTab === 'all') return eventsToFilter;
    return eventsToFilter.filter(event => 
      activeTab === 'paid' ? event.isPaid : !event.isPaid
    );
  };

  const renderEventTypeIcon = (isPaid) => (
    <View style={styles.eventTypeIconContainer}>
      <Ionicons
        name={isPaid ? 'ticket-outline' : 'gift-outline'}
        size={15}
        color="#4a90e2"
      />
      <Text style={styles.eventTypeText}>
        {isPaid ? 'Tickets' : 'Free'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#737373"
            />
          </View>
          <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
            <Ionicons name="options" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.sortMenu, { height: dropdownHeight }]}>
          <TouchableOpacity onPress={() => { setSortOption('New'); setShowSortMenu(false); }}>
            <Text style={[styles.sortOption, sortOption === 'New' && styles.activeSortOption]}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSortOption('Popular'); setShowSortMenu(false); }}>
            <Text style={[styles.sortOption, sortOption === 'Popular' && styles.activeSortOption]}>Popular</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'free' && styles.activeTab]}
            onPress={() => setActiveTab('free')}
          >
            <Text style={[styles.tabText, activeTab === 'free' && styles.activeTabText]}>Free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'paid' && styles.activeTab]}
            onPress={() => setActiveTab('paid')}
          >
            <Text style={[styles.tabText, activeTab === 'paid' && styles.activeTabText]}>Paid</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={filteredEventsByType()}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              {renderEventTypeIcon(item.isPaid)}
              <EventCard
                event={item}
                onPress={() => handleEventPress(item)}
                userId={user._id}
                token={token}
                fullWidth={false}
              />
            </View>
          )}
          contentContainerStyle={styles.eventList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  header: {
    padding: 16,
    backgroundColor: '#1f1f3c',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    padding: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#e0e0e0',
  },
  sortMenu: {
    overflow: 'hidden',
    backgroundColor: '#2a2a4a',
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  sortOption: {
    color: '#aaa',
    paddingVertical: 4,
    marginVertical: 5,
  },
  activeSortOption: {
    color: '#4a90e2',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  tab: {
    padding: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4a90e2',
  },
  tabText: {
    color: '#aaa',
  },
  activeTabText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventList: {
    paddingBottom: 16,
  },
  eventTypeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    width: 50
  },
  eventTypeText: {
    marginLeft: 4,
    color: '#4a90e2',
    fontSize: 12,
  },
});

export default HomeScreen;