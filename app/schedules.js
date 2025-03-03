import React, { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { loadEvents, saveEvents, loadAlarms, saveAlarms } from '../src/utils/eventUtils';
import { cancelAlarmForEvent } from '../src/utils/alarmService';
import AllEventsScreen from '../src/screens/AllEventsScreen';
import { Platform, View, StyleSheet, Modal, Text, TouchableOpacity, Alert, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventDetailsScreen from '../src/screens/EventDetailsScreen';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function MySchedules() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventsMap, setEventsMap] = useState({});
  
  const fetchEvents = async () => {
    const eventsData = await loadEvents();
    // Store both the map and array versions of events
    setEventsMap(eventsData);
    
    // Convert events object to array for AllEventsScreen
    const eventsArray = [];
    const seenEventIds = new Set(); // Track IDs to prevent duplicates
    
    // Process the events object into an array
    Object.keys(eventsData).forEach(date => {
      if (Array.isArray(eventsData[date])) {
        eventsData[date].forEach(event => {
          // Only add the event if we haven't seen this ID before
          if (!event.id || !seenEventIds.has(event.id)) {
            eventsArray.push({
              ...event,
              date: date
            });
            
            // Track this ID to prevent duplicates
            if (event.id) {
              seenEventIds.add(event.id);
            }
          }
        });
      }
    });
    
    console.log(`Loaded ${eventsArray.length} unique events for AllEventsScreen`);
    setEvents(eventsArray);
  };
  
  // Fetch events on initial load
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // Reload events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      return () => {}; // cleanup function
    }, [])
  );
  
  const handleEventDetails = (event) => {
    setCurrentEvent(event);
    setShowEventDetails(true);
  };
  
  const handleDeleteEvent = async (eventId, date) => {
    console.log('Delete event called in schedules.js with:', eventId, date);
    
    try {
      // Load current events from storage
      const currentEvents = await loadEvents();
      const currentAlarms = await loadAlarms();
      
      // Check if we have events for this date
      if (!currentEvents[date]) {
        console.error("No events found for date:", date);
        Alert.alert("Error", "Could not find events for the selected date.");
        return;
      }
      
      // Find and remove the event
      const originalLength = currentEvents[date].length;
      currentEvents[date] = currentEvents[date].filter(e => e.id !== eventId);
      
      // If no events left for this date, remove the date entry
      if (currentEvents[date].length === 0) {
        delete currentEvents[date];
      }
      
      // Verify that we actually removed something
      if (currentEvents[date] && currentEvents[date].length === originalLength) {
        console.error("Event not found for deletion. ID:", eventId);
        Alert.alert("Error", "Could not find the event to delete.");
        return;
      }
      
      // Save the updated events
      await saveEvents(currentEvents);
      
      // Handle alarm cancellation if needed
      if (currentAlarms[eventId]) {
        await cancelAlarmForEvent(currentAlarms[eventId]);
        delete currentAlarms[eventId];
        await saveAlarms(currentAlarms);
      }
      
      console.log("Event deleted successfully");
      
      // Close the details view after deleting
      setShowEventDetails(false);
      
      // Refresh events after deletion
      fetchEvents();
      
      // Show success toast or alert
      if (Platform.OS === 'android') {
        ToastAndroid.show("Event deleted successfully!", ToastAndroid.SHORT);
      } else {
        Alert.alert("Success", "Event deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      Alert.alert("Error", "An error occurred while deleting the event. Please try again.");
    }
  };
  
  const handleEditEvent = (event) => {
    // Navigate to the newEvent screen with the event data
    router.push({
      pathname: '/newEvent',
      params: {
        event: JSON.stringify(event),
        date: event.date,
        isEditing: 'true'
      }
    });
    // Close details screen
    setShowEventDetails(false);
  };
  
  const handleAddNewEvent = () => {
    // Navigate to the dedicated new event screen
    router.push('/newEvent');
  };
  
  const handleDuplicateEvent = (event) => {
    // Create a duplicate of the event but with a new ID
    const duplicateEvent = {
      ...event,
      id: undefined // Remove ID so a new one will be generated
    };
    
    // Navigate to newEvent with the duplicated event data
    router.push({
      pathname: '/newEvent',
      params: {
        event: JSON.stringify(duplicateEvent),
        date: event.date
      }
    });
    
    // Close details screen
    setShowEventDetails(false);
  };
  
  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'right', 'left']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "My Schedule",
          headerStyle: {
            backgroundColor: '#fada5e',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      
      <View style={styles.container}>
        <AllEventsScreen 
          events={events}
          router={router}
          onEventDetails={handleEventDetails}
          onAddNewEvent={handleAddNewEvent}
          onDeleteEvent={handleDeleteEvent}
        />
        
        {/* Backup Add Event button */}
        <TouchableOpacity 
          style={styles.addButtonBackup}
          onPress={handleAddNewEvent}
        >
          <AntDesign name="plus" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Event Details Modal */}
        <Modal
          visible={showEventDetails}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowEventDetails(false)}
        >
          <View style={styles.modalContainer}>
            {currentEvent && (
              <EventDetailsScreen 
                event={currentEvent}
                onDelete={handleDeleteEvent}
                onDuplicate={handleDuplicateEvent}
                onAddNewEvent={handleAddNewEvent}
                onClose={() => setShowEventDetails(false)}
              />
            )}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#fada5e',
    position: 'relative',
  },
  container: {
    position: 'relative',
    backgroundColor: '#fff',
    height: '100%',
    overflow: 'visible',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButtonBackup: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fada5e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
}); 