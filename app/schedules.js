import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { loadEvents } from '../src/utils/eventUtils';
import AllEventsScreen from '../src/screens/AllEventsScreen';
import { Platform, View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import EventDetailsScreen from '../src/screens/EventDetailsScreen';
import EventFormScreen from '../src/screens/EventFormScreen';
import { AntDesign } from '@expo/vector-icons';

export default function MySchedules() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventsMap, setEventsMap] = useState({});
  
  useEffect(() => {
    const fetchEvents = async () => {
      const eventsData = await loadEvents();
      // Store both the map and array versions of events
      setEventsMap(eventsData);
      
      // Convert events object to array for AllEventsScreen
      const eventsArray = [];
      
      // Process the events object into an array
      Object.keys(eventsData).forEach(date => {
        if (Array.isArray(eventsData[date])) {
          eventsData[date].forEach(event => {
            eventsArray.push({
              ...event,
              date: date
            });
          });
        }
      });
      
      setEvents(eventsArray);
    };
    
    fetchEvents();
  }, []);
  
  const handleEventDetails = (event) => {
    setCurrentEvent(event);
    setShowEventDetails(true);
  };
  
  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setSelectedDate(event.date);
    setEndDate(event.date);
    setIsEditing(true);
    setShowEventForm(true);
    setShowEventDetails(false);
  };
  
  const handleDeleteEvent = (eventId, date) => {
    // We'll pass this to the home screen to handle the deletion
    router.replace({
      pathname: '/',
      params: { 
        deleteEvent: 'true', 
        eventId: eventId, 
        eventDate: date 
      }
    });
    setShowEventDetails(false);
  };
  
  const handleDuplicateEvent = (event) => {
    const newEvent = {
      ...event,
      title: `Copy of ${event.title}`,
      id: undefined // Will be generated on save
    };
    
    router.replace({
      pathname: '/',
      params: {
        duplicateEvent: JSON.stringify(newEvent),
        eventDate: event.date
      }
    });
    
    setShowEventDetails(false);
  };
  
  const handleAddNewEvent = () => {
    router.push('/');
  };
  
  const handleCloseDetails = () => {
    setShowEventDetails(false);
  };
  
  const handleCloseForm = () => {
    setShowEventForm(false);
  };
  
  const handleEventSave = (startDate, endDate, eventData) => {
    // Pass to home screen to handle the save
    router.replace({
      pathname: '/',
      params: { 
        updatedEvent: JSON.stringify(eventData),
        eventDate: startDate
      }
    });
    setShowEventForm(false);
  };
  
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "All Events" }} />
      
      <View style={styles.container}>
        <AllEventsScreen 
          events={events}
          router={router}
          onEventDetails={handleEventDetails}
          onEditEvent={handleEditEvent}
          onAddNewEvent={handleAddNewEvent}
        />
        
        {/* Event Details Modal */}
        <Modal
          visible={showEventDetails}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseDetails}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseDetails} style={styles.backButton}>
                <AntDesign name="arrowleft" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Event Details</Text>
              <View style={styles.placeholder} />
            </View>
            {currentEvent && (
              <EventDetailsScreen 
                event={currentEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onDuplicate={handleDuplicateEvent}
                onAddNewEvent={handleAddNewEvent}
              />
            )}
          </View>
        </Modal>
        
        {/* Event Form Modal */}
        <Modal
          visible={showEventForm}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseForm}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseForm} style={styles.backButton}>
                <AntDesign name="arrowleft" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
              <View style={styles.placeholder} />
            </View>
            <EventFormScreen 
              startDate={selectedDate}
              endDate={endDate}
              event={currentEvent}
              events={eventsMap}
              isEditing={isEditing}
              onSave={handleEventSave}
            />
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingTop: Platform.OS === 'ios' ? 45 : 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  }
}); 