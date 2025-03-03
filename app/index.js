import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Platform, SafeAreaView } from 'react-native';
import CalendarScreen from '../src/screens/CalendarScreen';
import EventFormScreen from '../src/screens/EventFormScreen';
import EventDetailsScreen from '../src/screens/EventDetailsScreen';
import { AntDesign } from '@expo/vector-icons';
import { loadEvents, saveEvents } from '../src/utils/eventUtils';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(null);
  const [events, setEvents] = useState({});
  
  const fetchEvents = async () => {
    const eventsData = await loadEvents();
    console.log("Fetched events in app/index.js:", {
      dateKeys: Object.keys(eventsData).length,
      totalEvents: Object.values(eventsData).flat().length
    });
    
    // Create a new object with unique events
    const uniqueEvents = {};
    const processedIds = new Set();
    
    // Process each date's events, only keeping unique ones
    Object.keys(eventsData).forEach(date => {
      if (!Array.isArray(eventsData[date])) return;
      
      // Create an array for this date if it doesn't exist
      if (!uniqueEvents[date]) {
        uniqueEvents[date] = [];
      }
      
      // Only add events that haven't been seen before
      eventsData[date].forEach(event => {
        if (!event.id || !processedIds.has(event.id)) {
          uniqueEvents[date].push(event);
          if (event.id) {
            processedIds.add(event.id);
          }
        }
      });
      
      // If there are no events for this date after deduplication, remove the date
      if (uniqueEvents[date].length === 0) {
        delete uniqueEvents[date];
      }
    });
    
    console.log("Deduplicated events:", {
      dateKeys: Object.keys(uniqueEvents).length,
      totalEvents: Object.values(uniqueEvents).flat().length
    });
    
    setEvents(uniqueEvents);
  };
  
  useEffect(() => {
    // Load events when component mounts
    fetchEvents();
  }, []);
  
  // Refresh events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      return () => {}; // cleanup function
    }, [])
  );
  
  useEffect(() => {
    if (params?.eventsToSave) {
      // Handle saving multiple events logic would go here
      router.setParams({ eventsToSave: undefined });
    } else if (params?.updatedEvent) {
      // Handle saving single event logic would go here
      router.setParams({ updatedEvent: undefined, eventDate: undefined });
    } else if (params?.deleteEvent) {
      // Handle deleting event logic would go here
      router.setParams({ deleteEvent: undefined, eventId: undefined, eventDate: undefined });
    }
  }, [params]);
  
  const handleDayPress = (date, startDate, endDate) => {
    // Store the selected dates for other components
    setSelectedDate(startDate || date);
    setEndDate(endDate || date);
    setCurrentEvent(null);
  };
  
  const handleEventSave = (eventData) => {
    // For this simplified version, we'll just close the form
    setShowEventForm(false);
    
    // In a real implementation, you would handle saving the events to storage
    // and refreshing the calendar view
  };
  
  const handleEventPress = (event) => {
    setCurrentEvent(event);
    setShowEventDetails(true);
    setShowEventForm(false);
  };
  
  const handleDeleteEvent = async (eventId, date) => {
    console.log('Delete event called with:', eventId, date);
    
    try {
      // Load current events
      const currentEvents = await loadEvents();
      
      // Check if we have events for this date
      if (!currentEvents[date]) {
        console.error("No events found for date:", date);
        return;
      }
      
      // Find and remove the event
      const originalLength = currentEvents[date].length;
      currentEvents[date] = currentEvents[date].filter(e => e.id !== eventId);
      
      // If no events left for this date, remove the date entry
      if (currentEvents[date].length === 0) {
        delete currentEvents[date];
      }
      
      // Save the updated events
      await saveEvents(currentEvents);
      console.log("Event deleted successfully");
      
      // Close the details view
      setShowEventDetails(false);
      
      // Refresh events
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };
  
  const handleAddNewEvent = () => {
    // Navigate to the newEvent screen
    router.push('/newEvent');
  };
  
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CalendarScreen
        params={params}
        router={router}
        events={events}
        onEventSave={handleEventSave}
        onEventDetails={handleEventPress}
        onDeleteEvent={handleDeleteEvent}
        onDayPress={handleDayPress}
        onAddNewEvent={handleAddNewEvent}
      />
      
      {/* Event Details Modal */}
      <Modal
        visible={showEventDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(255, 255, 255, 1)' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventDetails(false)} style={styles.backButton}>
              <AntDesign name="arrowleft" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Details</Text>
            <View style={styles.placeholder} />
          </View>
          {currentEvent && (
            <EventDetailsScreen 
              event={currentEvent}
              onDelete={handleDeleteEvent}
              onAddNewEvent={handleAddNewEvent}
              onClose={() => setShowEventDetails(false)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 0, // Add padding at the top to prevent camera overlay
    paddingBottom: Platform.OS === 'ios' ? 90 : 60, // Add padding at the bottom to prevent overlap with camera/navbar
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  }
}); 