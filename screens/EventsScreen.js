import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { getApprovedEventsRoute } from '../utils/APIRoutes';

const EventsScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApprovedEventsRoute);
      const currentDate = new Date();
      const filteredEvents = res.data
        .filter(event => new Date(event.date) >= currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const formattedEvents = formatEvents(filteredEvents);
      setEvents(formattedEvents);
      setSelectedDate(today); // Set the initial selected date to today
    } catch (err) {
      setError('Failed to fetch events. Please try again.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEvents = (eventsData) => {
    const formatted = {};
    eventsData.forEach(event => {
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!formatted[dateKey]) {
        formatted[dateKey] = [];
      }
      formatted[dateKey].push(event);
    });
    return formatted;
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getMarkedDates = () => {
    const markedDates = {};
    Object.keys(events).forEach(date => {
      markedDates[date] = {
        marked: true,
        dotColor: '#4a90e2',
        customStyles: {
          container: {
            backgroundColor: '#1f1f3c',
          },
          text: {
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      };
    });
    // Add selected date marking
    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: '#4a90e2',
      };
    }
    return markedDates;
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetails', { event: item })}
    >
      <View style={styles.eventImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} resizeMode='stretch' style={styles.eventImage} />
        ) : (
          <View style={styles.eventImagePlaceholder} />
        )}
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.eventLocation}>{item.location}</Text>
        <Text style={styles.eventPrice}>
          {item.isPaid ? `$${item.ticketPrice.toFixed(2)}` : 'Free'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventsList = () => {
    if (new Date(selectedDate) < new Date(today)) {
      return <Text style={styles.emptyText}>No events available for past dates</Text>;
    }

    const eventsForSelectedDate = events[selectedDate] || [];
    
    if (eventsForSelectedDate.length === 0) {
      return <Text style={styles.emptyText}>No events for this date</Text>;
    }

    return (
      <FlatList
        data={eventsForSelectedDate}
        renderItem={renderEventItem}
        keyExtractor={(item) => item._id.toString()}
      />
    );
  };

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
        markingType={'custom'}
        current={today}
        theme={{
          selectedDayBackgroundColor: '#4a90e2',
          selectedDayTextColor: '#fff',
          todayTextColor: '#4a90e2',
          textDayFontWeight: '600',
          textDayStyle: {
            color: '#fff',
          },
          calendarBackground: '#131324',
          dayTextColor: '#aaa',
          monthTextColor: 'white',
        }}
      />
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>
            Events for {selectedDate || today}
          </Text>
          {renderEventsList()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131324',
  },
  eventsContainer: {
    flex: 1,
    padding: 10,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f3c',
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4a90e2',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  eventPrice: {
    fontSize: 14,
    color: '#4a90e2',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventsScreen;