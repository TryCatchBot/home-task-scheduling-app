import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Platform } from 'react-native';
import CalendarScreen from '../src/screens/CalendarScreen';
import EventFormScreen from '../src/screens/EventFormScreen';
import EventDetailsScreen from '../src/screens/EventDetailsScreen';
import { AntDesign } from '@expo/vector-icons';
import { loadEvents } from '../src/utils/eventUtils';

export default function Home() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [events, setEvents] = useState({});
  
  useEffect(() => {
    // Load events when component mounts
    const fetchEvents = async () => {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    };
    
    fetchEvents();
  }, []);
  
  useEffect(() => {
    // Handle params from router
    if (params?.updatedEvent && params?.eventDate) {
      handleEventSave(params.eventDate, params.eventDate, JSON.parse(params.updatedEvent));
      router.setParams({ updatedEvent: undefined, eventDate: undefined });
    } else if (params?.deleteEvent === 'true' && params?.eventId && params?.eventDate) {
      handleDeleteEvent(params.eventId, params.eventDate);
      router.setParams({ deleteEvent: undefined, eventId: undefined, eventDate: undefined });
    } else if (params?.duplicateEvent && params?.eventDate) {
      const duplicateEvent = JSON.parse(params.duplicateEvent);
      handleEventSave(params.eventDate, params.eventDate, duplicateEvent);
      router.setParams({ duplicateEvent: undefined, eventDate: undefined });
    }
  }, [params]);
  
  const handleDayPress = (date, startDate, endDate) => {
    // Store the selected dates for other components
    setSelectedDate(startDate || date);
    setEndDate(endDate || date);
    setCurrentEvent(null);
    setIsEditing(false);
    
    // Make sure we're not showing other forms or details
    setShowEventForm(false);
    setShowEventDetails(false);
  };
  
  const handleEventSave = (startDate, endDate, eventData) => {
    // This function will be passed down to EventFormScreen
    // and then back up to CalendarScreen
    setShowEventForm(false);
    // We'll handle refreshing the calendar in CalendarScreen
  };
  
  const handleEventPress = (event) => {
    console.log('Event press called with:', event);
    setCurrentEvent(event);
    setShowEventDetails(true);
    setShowEventForm(false);
    
    // Force timeout to ensure state updates before rendering
    setTimeout(() => {
      console.log('Event details state - showEventDetails:', true, 'Event:', event.title);
    }, 0);
  };
  
  const handleEditEvent = (event) => {
    console.log('Edit event called with:', event);
    setCurrentEvent(event);
    setSelectedDate(event.date);
    setEndDate(event.date);
    setIsEditing(true);
    setShowEventForm(true);
    setShowEventDetails(false);
    
    // Force timeout to ensure state updates before rendering
    setTimeout(() => {
      console.log('Edit state after timeout - showEventForm:', true);
    }, 0);
  };
  
  const handleDeleteEvent = (eventId, date) => {
    // We'll pass this down to CalendarScreen
    setShowEventDetails(false);
  };
  
  const handleDuplicateEvent = (event) => {
    const newEvent = {
      ...event,
      title: `Copy of ${event.title}`,
      id: undefined // Will be generated on save
    };
    
    setCurrentEvent(newEvent);
    setSelectedDate(event.date);
    setEndDate(event.date);
    setIsEditing(false);
    setShowEventForm(true);
    setShowEventDetails(false);
  };
  
  const handleCloseForm = () => {
    setShowEventForm(false);
  };
  
  const handleCloseDetails = () => {
    setShowEventDetails(false);
  };
  
  return (
    <>
      {/* No need for header when using our custom web navbar */}
      {Platform.OS !== 'web' && <Stack.Screen options={{ headerShown: false }} />}
      
      <View style={styles.container}>
        <CalendarScreen 
          params={params}
          router={router}
          onEventSave={handleEventSave}
          onEventDetails={handleEventPress}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onDayPress={handleDayPress}
        />
        
        {/* Event Form Modal */}
        {Platform.OS === 'web' ? (
          // On web, show the form directly in the page when visible,
          // but only for edit/duplicate cases, not for new events from calendar day press
          showEventForm && (
            <View style={styles.webFormContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
                <TouchableOpacity onPress={handleCloseForm} style={styles.closeButton}>
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <EventFormScreen 
                startDate={selectedDate}
                endDate={endDate}
                event={currentEvent}
                events={events}
                isEditing={isEditing}
                onSave={handleEventSave}
              />
            </View>
          )
        ) : (
          // On mobile, use a modal with improved rendering
          <Modal
            visible={showEventForm}
            animationType="fade"
            transparent={true}
            onRequestClose={handleCloseForm}
          >
            <View style={[styles.modalContainer, { backgroundColor: 'rgba(255, 255, 255, 1)' }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseForm} style={styles.backButton}>
                  <AntDesign name="arrowleft" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
                <View style={styles.placeholder} />
              </View>
              {showEventForm && (
                <EventFormScreen 
                  startDate={selectedDate}
                  endDate={endDate}
                  event={currentEvent}
                  events={events}
                  isEditing={isEditing}
                  onSave={handleEventSave}
                />
              )}
            </View>
          </Modal>
        )}
        
        {/* Event Details Modal */}
        <Modal
          visible={showEventDetails}
          animationType="fade"
          transparent={true}
          onRequestClose={handleCloseDetails}
        >
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(255, 255, 255, 1)' }]}>
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
                onAddNewEvent={() => handleDayPress(new Date().toISOString().split('T')[0])}
              />
            )}
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
  webFormContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
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