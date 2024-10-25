import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner-native';
import { getApprovedEventsRoute, deleteEventRoute } from '../utils/APIRoutes';
import RBSheet from "react-native-raw-bottom-sheet";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const TicketScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [postedEvents, setPostedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticket, setTicket] = useState('');
  const bottomSheetRef = useRef();

  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  const fetchRegisteredEvents = async () => {
    try {
    const response = await axios.get(getApprovedEventsRoute, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const allEvents = response.data;

    const filteredEvents = allEvents.filter(event =>
        event.registeredUsers && event.registeredUsers.includes(user._id)
    );

    setRegisteredEvents(filteredEvents);
    } catch (err) {
    console.error("Error fetching registered events:", err.response);
    toast.error("Failed to fetch registered events");
    }
  };

  const generateTicket = (eventId) => {
    setTicket(`${eventId}_${user._id}`)
    bottomSheetRef.current.open();
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(deleteEventRoute(eventId), { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            setPostedEvents(postedEvents.filter(event => event._id !== eventId));
            toast.success("Event deleted successfully");
          } catch (err) {
            console.error("Error deleting event:", err);
            toast.error("Failed to delete event");
          }
        }
      }
    ]);
  };

  const renderTicket = (event) => (
    <View style={styles.ticket}>
      <Text style={styles.ticketTitle}>{event.title}</Text>
      <Text style={styles.ticketDate}>{new Date(event.date).toLocaleDateString()}</Text>
      <TouchableOpacity 
        style={{padding: 10, backgroundColor: '#1e1e36', borderRadius: 10, marginTop: 15, alignSelf: 'flex-start',}}
        onPress={() => generateTicket(event._id)}
      >
        <Text style={styles.ticketId}>Generate Ticket</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderEventItem = ({ item }) => (
    <View style={{padding: 5}}>
        <View style={styles.eventItem}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.eventImage}
          />
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity onPress={() => navigation.navigate('EventDetails', {event: item})}>
              <Ionicons name="calendar-outline" size={25} color='white' />
            </TouchableOpacity>
            <TouchableOpacity style={{marginLeft: 25}} onPress={() => console.log(item._id)}>
              <MaterialIcons name="delete" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        {renderTicket(item)}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Toaster />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
        <Text style={styles.sectionTitle}>Registered Events</Text>
          <FlatList
            data={registeredEvents}
            renderItem={({ item }) => (
              <>
                {renderEventItem({ item })}
              </>
            )}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={<Text style={styles.emptyText}>No registered events</Text>}
          />
        </View>
      </ScrollView>

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
  safeArea: {
    flex: 1,
    backgroundColor: '#131324',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#131324',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    marginTop: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  ticket: {
    backgroundColor: '#4F46E5',
    padding: 15,
    marginBottom: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5
  },
  ticketTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketDate: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  ticketId: {
    color: 'white',
    fontSize: 12,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  bottomSheetInput: {
    backgroundColor: '#374151',
    color: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  bottomSheetButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  bottomSheetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventItem: {
    backgroundColor: '#1F2937',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  eventActions: {
    flexDirection: 'row',
    width: 'fill',
    jusifySelf: 'space-between'
  },
});

export default TicketScreen;