import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventFormScreen from '../src/screens/EventFormScreen';
import { loadEvents, saveEvents, loadAlarms, saveAlarms } from '../src/utils/eventUtils';
import { scheduleAlarmForEvent, cancelAlarmForEvent } from '../src/utils/alarmService';
import { AntDesign } from '@expo/vector-icons';

export default function NewEventPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Check if we're in edit mode and load the event data
  useEffect(() => {
    console.log("NewEventPage params received:", params);
    
    if (params?.isEditing === 'true' && params?.event) {
      try {
        // Parse event JSON if it's a string
        let eventData;
        
        if (typeof params.event === 'string') {
          try {
            eventData = JSON.parse(params.event);
            console.log("Successfully parsed event JSON:", eventData?.title, eventData?.id);
          } catch (parseError) {
            console.error("Error parsing event JSON:", parseError);
            Alert.alert("Error", "Could not parse event data.");
            router.back();
            return;
          }
        } else {
          eventData = params.event;
        }
        
        // Ensure we have valid event data
        if (!eventData || !eventData.id) {
          console.error("Invalid event data for editing:", eventData);
          Alert.alert("Error", "Invalid event data.");
          router.back();
          return;
        }
        
        // Set event data for editing with date
        setEvent({
          ...eventData,
          date: params.date || eventData.date || new Date().toISOString().split('T')[0]
        });
        
        setIsEditing(true);
        console.log("Editing event:", eventData.title, eventData.id);
      } catch (error) {
        console.error("Error processing event data for editing:", error);
        Alert.alert("Error", "Could not load event data.");
        router.back();
      }
    } else if (params?.event) {
      // Handle case when we're creating a new event from a template
      try {
        let eventData;
        
        if (typeof params.event === 'string') {
          try {
            eventData = JSON.parse(params.event);
          } catch (parseError) {
            console.error("Error parsing template JSON:", parseError);
            // For templates, just proceed with a new event
            eventData = {};
          }
        } else {
          eventData = params.event;
        }
        
        setEvent({
          ...eventData,
          id: undefined, // Ensure ID is undefined for new events
          date: params.date || eventData.date || new Date().toISOString().split('T')[0]
        });
        
        console.log("Creating new event from template");
      } catch (error) {
        console.error("Error parsing event template data:", error);
        // For new events, we can just proceed with default values
      }
    } else {
      console.log("Creating brand new event, no template");
    }
  }, [params]);
  
  const handleEventSave = async (eventData) => {
    try {
      setIsLoading(true);
      console.log("NewEventPage handleEventSave called with:", 
        isEditing ? "EDIT MODE" : "CREATE MODE", 
        JSON.stringify(eventData));
      
      // If eventData is an array, process it as multiple events
      if (Array.isArray(eventData)) {
        router.push({
          pathname: "/",
          params: { eventsToSave: JSON.stringify(eventData) }
        });
        return;
      }
      
      // Get the event data (either new or updated)
      const eventToSave = eventData;
      
      // Load current events and alarms
      const eventsData = await loadEvents();
      const alarmsData = await loadAlarms();
      
      // Get the date from the event
      const date = eventToSave.date || new Date().toISOString().split('T')[0];
      
      // Create or update the events for this date
      if (!eventsData[date]) {
        eventsData[date] = [];
      }
      
      if (isEditing && eventToSave.id) {
        // EDITING: Find and update the existing event
        const eventIndex = eventsData[date].findIndex(e => e.id === eventToSave.id);
        
        if (eventIndex !== -1) {
          // Update the existing event at this date
          eventsData[date][eventIndex] = eventToSave;
        } else {
          // Check if event exists at another date and needs to be moved
          let foundInOtherDate = false;
          
          Object.keys(eventsData).forEach(otherDate => {
            if (otherDate !== date && Array.isArray(eventsData[otherDate])) {
              const otherIndex = eventsData[otherDate].findIndex(e => e.id === eventToSave.id);
              if (otherIndex !== -1) {
                // Remove from the old date
                eventsData[otherDate].splice(otherIndex, 1);
                foundInOtherDate = true;
                
                // If no events left for this date, remove the date entry
                if (eventsData[otherDate].length === 0) {
                  delete eventsData[otherDate];
                }
              }
            }
          });
          
          // Add to the new date
          eventsData[date].push(eventToSave);
        }
        
        // Handle alarm if set
        if (eventToSave.id) {
          // Cancel existing alarm if any
          if (alarmsData[eventToSave.id]) {
            await cancelAlarmForEvent(alarmsData[eventToSave.id]);
            delete alarmsData[eventToSave.id];
          }
          
          // Set new alarm if specified
          if (eventToSave.alarm && eventToSave.alarm !== 'none') {
            alarmsData[eventToSave.id] = {
              id: eventToSave.id,
              date: date,
              time: eventToSave.startTime,
              title: eventToSave.title,
              alarmSetting: eventToSave.alarm
            };
            
            await saveAlarms(alarmsData);
            await scheduleAlarmForEvent(alarmsData[eventToSave.id]);
          }
        }
        
        // Show success message for edit
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        // CREATING: Generate a unique ID for the new event
        const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        eventToSave.id = eventId;
        
        // Add the event to the events array for this date
        eventsData[date].push(eventToSave);
        
        // Handle alarm if set
        if (eventToSave.alarm && eventToSave.alarm !== 'none') {
          alarmsData[eventId] = {
            id: eventId,
            date: date,
            time: eventToSave.startTime,
            title: eventToSave.title,
            alarmSetting: eventToSave.alarm
          };
          
          await saveAlarms(alarmsData);
          await scheduleAlarmForEvent(alarmsData[eventId]);
        }
        
        // Show success message for create
        Alert.alert('Success', 'Event created successfully!');
      }
      
      // Save the updated events
      await saveEvents(eventsData);
      
      // Return to the calendar view
      router.push('/');
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'There was a problem saving your event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen 
        options={{
          title: isEditing ? 'Edit Event' : 'Create New Event',
          headerStyle: {
            backgroundColor: '#fada5e',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerShown: true,
        }}
      />
      
      <View style={styles.container}>
        <EventFormScreen 
          onSave={handleEventSave}
          allowModification={true}
          event={event}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#fada5e', // Match header color
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  }
}); 