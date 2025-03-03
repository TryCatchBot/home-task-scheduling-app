import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView, ActivityIndicator, ToastAndroid, Platform, Modal } from 'react-native';
import { Calendar, CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import { loadEvents, saveEvents, isPastDate, loadAlarms, saveAlarms } from '../utils/eventUtils';
import { scheduleAlarmForEvent, cancelAlarmForEvent } from '../utils/alarmService';
import EventFormScreen from './EventFormScreen';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { showToast } from '../utils/toastUtils';

// Different shades of yellow for event highlighting
const highlightColors = [
  '#fada5e', // Main yellow
  '#ffeb99', // Light yellow
  '#ffd700', // Gold
  '#f7dc6f', // Mellow yellow
  '#ffeaa7', // Cream
];

// Different colors for event badges
const badgeColors = [
  '#4285F4', // Blue
  '#EA4335', // Red
  '#34A853', // Green
  '#FBBC05', // Yellow
  '#8F44AD', // Purple
  '#16A085', // Teal
  '#F39C12', // Orange
  '#27AE60', // Emerald
  '#E74C3C', // Crimson
  '#3498DB', // Sky Blue
];

export default function CalendarScreen({ params, router, onEventSave, onEventDetails, onDayPress, onAddNewEvent, onDeleteEvent }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(null);  // Track the start date
  const [endDate, setEndDate] = useState(null);      // Track the end date
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  // Add state for showing event form inline
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [selectedFormDate, setSelectedFormDate] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]); // Track all selected dates
  
  const scrollRef = useRef();
  const todayRef = useRef();
  
  useEffect(() => {
    loadStoredEvents();
  }, []);
  
  useEffect(() => {
    if (params) {
      // Handle updatedEvent
      if (params.updatedEvent) {
        const updatedEvent = typeof params.updatedEvent === 'string' 
          ? JSON.parse(params.updatedEvent) 
          : params.updatedEvent;
        
        const eventDate = params.eventDate;
        handleEventUpdate(eventDate, updatedEvent);
        
        // Clear params
        router.setParams({});
      } 
      // Handle deleteEvent
      else if (params.deleteEvent === 'true' && params.eventId && params.eventDate) {
        handleDeleteEvent(params.eventId, params.eventDate);
        
        // Clear params
        router.setParams({});
      }
      // Handle duplicateEvent
      else if (params.duplicateEvent && params.eventDate) {
        const duplicateEvent = typeof params.duplicateEvent === 'string'
          ? JSON.parse(params.duplicateEvent)
          : params.duplicateEvent;
          
        handleEventSave(params.eventDate, params.eventDate, duplicateEvent);
        
        // Clear params
        router.setParams({});
      }
    }
  }, [params]);

  // Update marked dates whenever selectedStartDate or selectedEndDate changes
  useEffect(() => {
    updateMarkedDates(events);
  }, [selectedDate, events]);

  const loadStoredEvents = async () => {
    const storedEvents = await loadEvents();
    console.log("Loaded events from storage:", storedEvents);
    console.log("Number of dates with events:", Object.keys(storedEvents).length);
    console.log("Total events loaded:", Object.values(storedEvents).flat().length);
    setEvents(storedEvents);
    updateMarkedDates(storedEvents);
  };

  // Helper function to get a truncated title for event badges
  const getTruncatedTitle = (title, maxLength = 15) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  // Helper function to get a color hash for an event name
  const getColorForEvent = (eventId) => {
    const index = Math.abs(eventId.split('-')[0]) % badgeColors.length;
    return badgeColors[index];
  };

  const updateMarkedDates = (eventData) => {
    console.log("updateMarkedDates called with eventData:", 
      eventData && typeof eventData === 'object' && 'selectedDates' in eventData ? 
      `selectedDates: ${eventData.selectedDates?.length}` : 
      "regular events object");
    
    const marked = {};
    
    // Add event dots to the marked dates
    Object.keys(events).forEach(date => {
      if (events[date] && events[date].length > 0) {
        marked[date] = {
          ...marked[date],
          dots: events[date].map(event => ({
            key: event.id,
            color: getColorForEvent(event.id),
            selectedDotColor: '#ffffff'
          }))
        };
      }
    });
    
    console.log("Dates marked with events:", Object.keys(marked).length);
    if (Object.keys(marked).length > 0) {
      console.log("Sample marked dates:", Object.keys(marked).slice(0, 3));
    }
    
    // Determine which selected dates to use
    let datesToMark = [];
    let startDateToUse = null;
    let endDateToUse = null;
    
    // If eventData has selectedDates property, use that
    if (eventData && eventData.selectedDates) {
      datesToMark = eventData.selectedDates;
      startDateToUse = eventData.startDate;
      endDateToUse = eventData.endDate;
      console.log("Using eventData.selectedDates:", datesToMark.length);
    } 
    // Otherwise use the component's selectedDates state
    else if (selectedDates.length > 0) {
      datesToMark = selectedDates;
      // Sort dates to find earliest and latest
      const sortedDates = [...selectedDates].sort((a, b) => new Date(a) - new Date(b));
      startDateToUse = sortedDates[0];
      endDateToUse = sortedDates[sortedDates.length - 1];
      console.log("Using component selectedDates:", datesToMark.length);
    }
    
    // Mark selected dates
    if (datesToMark.length > 0) {
      console.log("Marking selected dates:", datesToMark);
      datesToMark.forEach(date => {
        const isStartDate = date === startDateToUse;
        const isEndDate = date === endDateToUse;
        
        marked[date] = {
          ...marked[date],
          selected: true,
          // Use different styling for start and end dates
          selectedColor: isStartDate || isEndDate ? '#ffcc00' : '#fff0b3', // Stronger yellow for start/end, lighter for middle
          textColor: '#000',
          // Add border for start and end dates
          customStyles: isStartDate || isEndDate ? {
            container: {
              borderWidth: 2,
              borderColor: isStartDate ? '#ff9900' : '#cc6600' // Orange for start, darker orange for end
            }
          } : undefined
        };
      });
    }
    
    setMarkedDates(marked);
  };

  // Event handler for when an event is pressed
  const handleEventPress = (event) => {
    if (onEventDetails) {
      onEventDetails(event);
    }
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    
    // Add to selected dates list - only add if it's not already selected
    let newSelectedDates;
    
    if (!selectedDates.includes(dateString)) {
      // Add date to selections
      newSelectedDates = [...selectedDates, dateString];
    } else {
      // If date already selected, remove it
      newSelectedDates = selectedDates.filter(d => d !== dateString);
    }
    
    // Update selected dates
    setSelectedDates(newSelectedDates);
    
    // Sort dates chronologically to determine start and end dates
    if (newSelectedDates.length > 0) {
      // Sort the dates (earliest to latest)
      const sortedDates = [...newSelectedDates].sort((a, b) => new Date(a) - new Date(b));
      
      // Use the earliest date as start date and latest as end date
      const earliestDate = sortedDates[0];
      const latestDate = sortedDates[sortedDates.length - 1];
      
      // Set the start and end dates for form prefilling
      setStartDate(earliestDate);
      setEndDate(latestDate);
      
      // Update the calendar UI to show marked dates
      updateMarkedDates({ 
        selectedDates: newSelectedDates,
        startDate: earliestDate,
        endDate: latestDate
      });
      
      // Set the selected date for form display (use the earliest by default)
      setSelectedDate(earliestDate);
      setSelectedFormDate(earliestDate);
      
      // Show the event form automatically with the selected dates
      setShowInlineForm(true);
      setCurrentEvent(null); // Clear any existing event data (we're creating a new one)
      
      // Notify parent component about the selected dates
      if (onDayPress) {
        onDayPress(dateString, earliestDate, latestDate);
      }
    } else {
      // No dates selected, reset everything
      setStartDate(null);
      setEndDate(null);
      
      updateMarkedDates({ 
        selectedDates: []
      });
      
      // Set the selected date for form display
      setSelectedDate(null);
      setSelectedFormDate(null);
      
      // Don't show the form if all dates were deselected
      setShowInlineForm(false);
      
      // Notify parent component
      if (onDayPress) {
        onDayPress(null, null, null);
      }
    }
  };

  const handleEventSave = async (startDate, endDate, eventData) => {
    console.log("handleEventSave called with:", { 
      startDate, 
      endDate, 
      eventData: eventData ? (typeof eventData === 'object' ? 
        (Array.isArray(eventData) ? 
          `${eventData.length} events` : 
          eventData.title) : eventData) : null,
      selectedDatesCount: selectedDates.length,
      selectedFormDate
    });
    
    // Handle 'eventsToSave' parameter which comes as a JSON string from router params
    if (typeof eventData === 'string' && eventData.startsWith('[')) {
      try {
        const parsedEvents = JSON.parse(eventData);
        if (Array.isArray(parsedEvents)) {
          console.log(`Processing parsed array of ${parsedEvents.length} events from JSON`);
          
          // Load fresh data to avoid any stale state issues
          const currentEvents = await loadEvents();
          const currentAlarms = await loadAlarms();
          let updatedEvents = { ...currentEvents };
          let updatedAlarms = { ...currentAlarms };
          let processedEvents = [];
          
          // Create a Set to track IDs we've already processed to prevent duplicates
          const processedIds = new Set();
          
          // Process each event individually to ensure unique properties
          for (const event of parsedEvents) {
            // Skip if we've already processed an event with this title to prevent duplicates
            if (processedIds.has(event.title)) {
              console.log(`Skipping duplicate event title: ${event.title}`);
              continue;
            }
            
            const result = await processEventForDates(
              {...event}, // Create a new object copy to avoid reference issues
              { startDate, endDate },
              updatedEvents,
              updatedAlarms
            );
            
            if (result) {
              if (result.hasDuplicates) {
                // Show alert about duplicate event title for this specific event
                Alert.alert(
                  'Duplicate Event Title',
                  `An event with the title "${event.title}" already exists on one or more selected dates.`,
                  [
                    {
                      text: 'Skip',
                      style: 'cancel',
                    },
                    {
                      text: 'Overwrite',
                      onPress: async () => {
                        // Force update by removing existing events with this title
                        Object.keys(updatedEvents).forEach(date => {
                          updatedEvents[date] = updatedEvents[date].filter(e => e.title !== event.title);
                        });
                        
                        // Re-process the event without duplicate check
                        const forceResult = await processEventForDates(
                          {...event},
                          { startDate, endDate },
                          updatedEvents,
                          updatedAlarms
                        );
                        
                        if (forceResult) {
                          processedEvents.push(...forceResult.createdIds);
                          updatedEvents = forceResult.updatedEvents;
                          updatedAlarms = forceResult.updatedAlarms;
                          
                          // Save to storage
                          await saveEvents(updatedEvents);
                          await saveAlarms(updatedAlarms);
                          await loadStoredEvents();
                          
                          showToast(`Event "${event.title}" was overwritten successfully!`);
                        }
                      }
                    }
                  ]
                );
          continue;
        }
        
              processedEvents.push(...result.createdIds);
              updatedEvents = result.updatedEvents;
              updatedAlarms = result.updatedAlarms;
            }
          }
          
          // Save the updated events and alarms
          await saveEvents(updatedEvents);
          await saveAlarms(updatedAlarms);
          
          // Refresh the displayed events
          await loadStoredEvents();
          
          // Set up alarms for the new events
          for (const eventId of processedEvents) {
            const alarm = updatedAlarms[eventId];
            if (alarm) {
              await scheduleAlarmForEvent(alarm);
            }
          }
          
          showToast(`Created ${processedEvents.length} events successfully!`);
          
          // Close form and clear selection
          setShowInlineForm(false);
          setSelectedDates([]);
          
          return;
        }
      } catch (error) {
        console.error("Error parsing events JSON:", error);
      }
    }
    
    // Determine which dates to use (selected dates or form dates)
    let actualStartDate, actualEndDate;
    
    if (selectedDates.length > 0) {
      // We have selected dates from the calendar
      // Sort them to get earliest and latest
      const sortedDates = [...selectedDates].sort((a, b) => new Date(a) - new Date(b));
      actualStartDate = sortedDates[0];
      actualEndDate = sortedDates[sortedDates.length - 1];
      console.log("Using calendar selected dates:", { actualStartDate, actualEndDate });
    } else {
      // No calendar selections, use whatever came from the form
      actualStartDate = startDate || selectedFormDate;
      actualEndDate = endDate || selectedFormDate; 
      console.log("Using form dates:", { actualStartDate, actualEndDate, selectedFormDate });
    }
    
    // Check if eventData is an array (multiple events) or a single event
    if (Array.isArray(eventData)) {
      console.log(`Processing ${eventData.length} events from form`);
      
      // Load fresh data to avoid any stale state issues
      const currentEvents = await loadEvents();
      const currentAlarms = await loadAlarms();
      let updatedEvents = { ...currentEvents };
      let updatedAlarms = { ...currentAlarms };
      let processedEvents = [];
      
      // Create a Set to track titles we've already processed to prevent duplicates
      const processedTitles = new Set();
      
      // Process each event individually with its own copy of data
      for (const event of eventData) {
        // Skip if we've already processed an event with this title to prevent duplicates
        if (processedTitles.has(event.title)) {
          console.log(`Skipping duplicate event title: ${event.title}`);
          continue;
        }
        
        const result = await processEventForDates(
          {...event}, // Create a new object copy to avoid reference issues
          { startDate: actualStartDate, endDate: actualEndDate },
          updatedEvents,
          updatedAlarms
        );
        
        if (result) {
          updatedEvents = result.updatedEvents;
          updatedAlarms = result.updatedAlarms;
          processedEvents.push({
            title: event.title,
            id: result.createdIds[0] // Get the ID of the created event
          });
          
          // Track this title to prevent duplicates
          processedTitles.add(event.title);
        }
      }
      
      // Save the final state after all events are processed
    await saveEvents(updatedEvents);
      await saveAlarms(updatedAlarms);
    
      // Update UI state
    setEvents(updatedEvents);
    updateMarkedDates(updatedEvents);

      // Show success message
      showToast(`Created ${processedEvents.length} events successfully!`);
    } else {
      // Handle single event
      const result = await processEventForDates(eventData, { 
        startDate: actualStartDate, 
        endDate: actualEndDate
      }, { ...events }, alarms);
      
      // Save updated events
      if (result) {
        const updatedEvents = result.updatedEvents;
        console.log(`Event saved. Events now has ${Object.keys(updatedEvents).length} dates with events`);
        
        await saveEvents(updatedEvents);
        await saveAlarms(result.updatedAlarms);
        
        // Update state with new events
        setEvents(updatedEvents);
        
        // This is important - make sure to update the marked dates with the new events
        updateMarkedDates(updatedEvents);
        
        // Show toast with result message
        const message = result.hasDuplicates ? 
          `Event "${eventData.title}" saved (with overlapping events)` : 
          `Event "${eventData.title}" saved successfully!`;
        
        showToast(message);
      }
    }
    
    // Close the form
    setShowInlineForm(false);
    
    // Clear selected dates after creating the event
    setSelectedDates([]);
  };

  // Helper function to process an event for multiple dates
  const processEventForDates = async (eventData, dateRange, updatedEvents, alarms) => {
    try {
    console.log("Processing event for dates:", { 
      eventTitle: eventData.title, 
        dateRange: JSON.stringify(dateRange)
      });
      
      // Handle objects with startDate/endDate properties (used in newer code)
      let dates = [];
      
      if (typeof dateRange === 'object' && 'startDate' in dateRange && 'endDate' in dateRange) {
        // Generate a range of dates between start and end
        const { startDate, endDate } = dateRange;
        
        // If only one date, just use that
        if (startDate === endDate || !endDate) {
          dates = [startDate];
        } else {
          // Generate dates between start and end
          const start = new Date(startDate);
          const end = new Date(endDate);
          const dateArray = [];
          
          let currentDate = start;
          while (currentDate <= end) {
            dateArray.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          dates = dateArray;
        }
      } else if (Array.isArray(dateRange)) {
        // Use the array directly if it's already an array of dates
        dates = dateRange;
      } else {
        // Fallback to single date if we couldn't determine format
        dates = [dateRange];
      }
      
      console.log(`Will create event for ${dates.length} dates:`, dates);
      
      // Keep track of IDs created for this event
    const createdIds = [];
    let hasDuplicates = false;
      let updatedAlarms = { ...alarms };
      
      // For multiple dates, we'll create only one event and reference it from other dates
      // This prevents creating multiple duplicate cards
      const primaryEventId = eventData.id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const primaryDate = dates[0]; // The first date will be the primary date
      
      // Create the primary event
      const primaryEvent = {
        ...eventData,
        id: primaryEventId,
        date: primaryDate,
        isMultiDay: dates.length > 1, // Flag to indicate this is a multi-day event
        relatedDates: dates.length > 1 ? dates.slice(1) : [], // Store related dates
      };
      
      // Initialize date in events object if needed
      if (!updatedEvents[primaryDate]) {
        updatedEvents[primaryDate] = [];
      }
      
      // Check for duplicate event title on the primary date
      const duplicateEvent = updatedEvents[primaryDate].find(
        e => e.title === primaryEvent.title && (eventData.id ? e.id !== eventData.id : true)
      );
      
      if (duplicateEvent) {
        console.log(`Duplicate event found on ${primaryDate}: ${eventData.title}`);
        hasDuplicates = true;
        return { updatedEvents, updatedAlarms, createdIds, hasDuplicates };
      }
      
      // If event has an ID, update it
      if (eventData.id) {
        // First, remove this event from all dates (it might have changed dates)
        Object.keys(updatedEvents).forEach(d => {
          updatedEvents[d] = updatedEvents[d].filter(e => e.id !== eventData.id);
          // Remove empty date entries
          if (updatedEvents[d].length === 0) {
            delete updatedEvents[d];
          }
        });
        
        // Then add it to the primary date
        if (!updatedEvents[primaryDate]) {
          updatedEvents[primaryDate] = [];
        }
        updatedEvents[primaryDate].push(primaryEvent);
      } else {
        // Adding a new event to the primary date
        updatedEvents[primaryDate].push(primaryEvent);
        createdIds.push(primaryEventId);
      }
      
      // Set up alarm for the primary event if needed
      if (primaryEvent.alarm && primaryEvent.alarm !== 'none') {
        updatedAlarms[primaryEventId] = {
          id: primaryEventId,
          date: primaryDate,
          time: primaryEvent.startTime,
          title: primaryEvent.title,
          alarmSetting: primaryEvent.alarm
        };
      }
      
      return { updatedEvents, updatedAlarms, createdIds, hasDuplicates };
    } catch (error) {
      console.error("Error in processEventForDates:", error);
      return null;
    }
  };

  const handleEventUpdate = async (date, updatedEvent) => {
    const dateEvents = [...(events[date] || [])];
    const eventIndex = dateEvents.findIndex(e => e.id === updatedEvent.id);
    
    if (eventIndex !== -1) {
      const oldEvent = dateEvents[eventIndex];
      
      // Update the event at the specified index
      dateEvents[eventIndex] = { ...oldEvent, ...updatedEvent };
      const updatedEvents = { ...events, [date]: dateEvents };
      
      // Update alarm if changed
      const alarms = await loadAlarms();
      const oldNotificationId = alarms[oldEvent.id];
      
      // Cancel old alarm if exists
      if (oldNotificationId) {
        await cancelAlarmForEvent(oldNotificationId);
        delete alarms[oldEvent.id];
      }
      
      // Schedule new alarm if enabled
      if (updatedEvent.alarm && updatedEvent.alarm !== 'none') {
        const fullEvent = { ...oldEvent, ...updatedEvent };
        const notificationId = await scheduleAlarmForEvent(fullEvent);
        if (notificationId) {
          alarms[updatedEvent.id] = notificationId;
        }
      }
      
      // Save events and alarms
      await saveEvents(updatedEvents);
      await saveAlarms(alarms);
      
      setEvents(updatedEvents);
      updateMarkedDates(updatedEvents);
      
      // Show success toast
      showToast(`Event "${updatedEvent.title}" updated successfully!`);
    }
  };

  const handleDeleteEvent = async (eventId, date) => {
    // Add confirmation dialog before deleting
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // If we have an external delete handler, use it first
              if (onDeleteEvent) {
                onDeleteEvent(eventId, date);
                return;
              }
              
              // Otherwise handle delete locally
              // Get the current event data from AsyncStorage
              const currentEvents = await loadEvents();
              const currentAlarms = await loadAlarms();
              
              // Find the event to delete
              const eventToDelete = currentEvents[date]?.find(e => e.id === eventId);
              const eventTitle = eventToDelete?.title || 'Event';
              
              // Filter out the event from the date array
              if (currentEvents[date]) {
                currentEvents[date] = currentEvents[date].filter(e => e.id !== eventId);
                
                // If the date has no more events, remove the date key entirely
                if (currentEvents[date].length === 0) {
                  delete currentEvents[date];
                }
                
                // Save the updated events to AsyncStorage
                await saveEvents(currentEvents);
                
                // Cancel associated alarm if exists
                if (currentAlarms[eventId]) {
                  await cancelAlarmForEvent(currentAlarms[eventId]);
                  delete currentAlarms[eventId];
                  await saveAlarms(currentAlarms);
                }
                
                // Update the UI
                setEvents(currentEvents);
                updateMarkedDates(currentEvents);
                
                // Show success toast
                showToast(`Event "${eventTitle}" deleted successfully!`);
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete the event. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDuplicateEvent = async (event) => {
    // Create a new event object based on the original event
    const newEvent = {
      ...event,
      title: `${event.title} (Copy)`, // Add (Copy) to differentiate
      id: undefined, // This will be generated in handleEventSave
    };
    
    // Check if this is a past event
    if (isPastDate(event.date)) {
      // If duplicating a past event, set it to start from today
      Alert.alert(
        'Duplicate to Current Date',
        'This is a past event. Do you want to duplicate it to today?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              const today = new Date().toISOString().split('T')[0];
              await handleEventSave(today, today, newEvent);
            },
          },
        ]
      );
    } else {
      // If it's a current or future event, keep the same date
      await handleEventSave(event.date, event.date, newEvent);
    }
    
    // Show success toast
    showToast(`Event "${event.title}" duplicated successfully!`);
  };

  // Memoize and optimize the event display calculation
  const displayEvents = useMemo(() => {
    const allEvents = Object.values(events).flat();
    console.log("All events for display calculation:", allEvents.length);
    
    if (allEvents.length > 0) {
      console.log("All events data sample:", JSON.stringify(allEvents.slice(0, 2)));
    }
    
    const nonPastEvents = allEvents.filter(event => !isPastDate(event.date));
    console.log("Non-past events for display:", nonPastEvents.length);
    
    // Extract timestamp from ID if available
    const getTimestampFromId = (id) => {
      if (!id) return 0;
      const parts = id.split('-');
      return parseInt(parts[0]) || 0;
    };
    
    // Deduplicate events by ID before displaying
    const uniqueEvents = [];
    const seenIds = new Set();
    
    for (const event of nonPastEvents) {
      if (!event.id || !seenIds.has(event.id)) {
        if (event.id) seenIds.add(event.id);
        uniqueEvents.push(event);
      }
    }
    
    console.log(`Removed ${nonPastEvents.length - uniqueEvents.length} duplicate events`);
    
    // Sort by creation time/ID descending (newest first) THEN by date/time
    const sortedEvents = uniqueEvents.sort((a, b) => {
      // Primary sort by ID (timestamp) to ensure newest events come first
      const timestampA = getTimestampFromId(a.id);
      const timestampB = getTimestampFromId(b.id);
      
      if (timestampA !== timestampB) {
        // Higher timestamp (newer) comes first
        return timestampB - timestampA;
      }
      
      // Secondary sort by date/time if timestamps are equal
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA - dateB;
    });
    
    // Limit to 4 events for Created Events section
    const limitedEvents = sortedEvents.slice(0, 4);
    console.log("Events being displayed (limited to 4):", limitedEvents.length);
    if (limitedEvents.length > 0) {
      console.log("First displayed event:", limitedEvents[0].title, "on", limitedEvents[0].date);
    }
    
    return limitedEvents;
  }, [events]);

  // Optimize the renderEventCard function with useCallback
  const renderEventCard = useCallback(({ item }) => {
    const isPast = isPastDate(item.date);
    const eventColor = getColorForEvent(item.id);
    const isMenuOpen = openMenuId === item.id;
    
    return (
      <View style={[
        styles.eventCard, 
        isPast && styles.pastEventCard,
        { borderLeftColor: eventColor, borderLeftWidth: 4 }
      ]}>
        {isMenuOpen && (
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            onPress={() => setOpenMenuId(null)}
            activeOpacity={0}
          />
        )}
        
        <TouchableOpacity
          style={styles.eventContent}
          onPress={() => {
            if (!isMenuOpen) {
              handleEventPress(item);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.eventTitle, isPast && styles.pastEventText]} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the parent's onPress
                setOpenMenuId(isMenuOpen ? null : item.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.kebabMenu}
            >
              <Entypo name="dots-three-vertical" size={22} color={isPast ? "#888" : "#666"} />
            </TouchableOpacity>
          </View>
          
          {isMenuOpen && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenuId(null);
                  handleDeleteEvent(item.id, item.date);
                }}
              >
                <MaterialIcons name="delete" size={16} color="#ff4444" />
                <Text style={styles.menuItemText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
         
          <View style={styles.eventDetailRow}>
            <AntDesign name="calendar" size={14} color={isPast ? "#888" : "#666"} style={styles.eventIcon} />
            <Text style={[styles.eventTime, isPast && styles.pastEventText]}>
              {new Date(item.date).toDateString()}
            </Text>
          </View>
          
          <View style={styles.eventDetailRow}>
            <AntDesign name="clockcircleo" size={14} color={isPast ? "#888" : "#666"} style={styles.eventIcon} />
            <Text style={[styles.eventTime, isPast && styles.pastEventText]}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          
          <View style={styles.eventDetailRow}>
            <AntDesign name="reload1" size={14} color={isPast ? "#888" : "#666"} style={styles.eventIcon} />
            <Text style={[styles.eventRepeat, isPast && styles.pastEventText]}>
              {item.repeat ? (item.repeat.charAt(0).toUpperCase() + item.repeat.slice(1)) : 'None'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [openMenuId, handleEventPress, handleDeleteEvent]);

  // Render event markers for the calendar
  const renderEventMarker = (date) => {
    console.log(`Rendering markers for date: ${date}, events:`, events[date] ? events[date].length : 0);
    if (!events[date] || events[date].length === 0) return null;
    
    if (events[date].length > 0) {
      console.log(`Event titles for ${date}:`, events[date].map(e => e.title).join(', '));
    }
    
    return (
      <View style={styles.eventMarkersContainer}>
        {events[date].slice(0, 3).map((event, idx) => (
          <TouchableOpacity 
            key={event.id} 
            style={[
              styles.eventMarker, 
              { backgroundColor: getColorForEvent(event.id) }
            ]}
            onPress={() => handleEventPress(event)}
          >
            <Text style={styles.eventMarkerText}>
              {getTruncatedTitle(event.title, 10)}
            </Text>
          </TouchableOpacity>
        ))}
        {events[date].length > 3 && (
          <Text style={styles.moreEventsText}>+{events[date].length - 3} more</Text>
        )}
      </View>
    );
  };

  // Handle closing the inline form
  const handleInlineFormClose = () => {
    setShowInlineForm(false);
    setSelectedDates([]);
  };
  
  // Handle navigation to create a new event
  const handleAddNew = () => {
    if (onAddNewEvent) {
      onAddNewEvent();
    } else if (router) {
      router.push('/new');
    }
  };

  // Handle saving events from the inline form
  const handleInlineEventSave = (formStartDate, formEndDate, eventData) => {
    console.log("handleInlineEventSave called with:", { 
      formStartDate, 
      formEndDate, 
      eventData: eventData ? (Array.isArray(eventData) ? `${eventData.length} events` : eventData.title) : null,
      selectedDatesCount: selectedDates.length,
      selectedFormDate
    });
    
    // Determine which dates to use (selected dates or form dates)
    let actualStartDate, actualEndDate;
    
    if (selectedDates.length > 0) {
      // We have selected dates from the calendar
      // Sort them to get earliest and latest
      const sortedDates = [...selectedDates].sort((a, b) => new Date(a) - new Date(b));
      actualStartDate = sortedDates[0];
      actualEndDate = sortedDates[sortedDates.length - 1];
      console.log("Using calendar selected dates:", { actualStartDate, actualEndDate });
    } else {
      // No calendar selections, use whatever came from the form
      actualStartDate = formStartDate || selectedFormDate;
      actualEndDate = formEndDate || selectedFormDate; 
      console.log("Using form dates:", { actualStartDate, actualEndDate, selectedFormDate });
    }
    
    // Check if eventData is an array (multiple events) or a single event
    if (Array.isArray(eventData)) {
      console.log(`Processing ${eventData.length} events from form`);
      
      // Process all events at once instead of calling handleEventSave for each event
      // This avoids duplicates by handling all events in a single batch
      handleEventSave(actualStartDate, actualEndDate, eventData);
    } else {
      // Handle single event
      handleEventSave(actualStartDate, actualEndDate, eventData);
    }
    
    // Close the form
    setShowInlineForm(false);
    
    // Clear selected dates after creating the event
    setSelectedDates([]);
  };

  // Add throttling to update marked dates to prevent excessive re-renders
  const updateMarkedDatesThrottled = useCallback(() => {
    // Only update if necessary
    if (!markedDates || Object.keys(markedDates).length === 0) {
      updateMarkedDates(events);
    }
  }, [events, updateMarkedDates, markedDates]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateMarkedDatesThrottled();
    }, 300); // Throttle to every 300ms
    
    return () => clearTimeout(timer);
  }, [events, updateMarkedDatesThrottled]);

  // Reset form state
  const resetFormState = () => {
    setSelectedFormDate(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentEvent(null);
    setSelectedDates([]);
  };

  return (
    <>
    <ScrollView ref={scrollRef} style={styles.container}>
      <View style={styles.calendarSection}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="multi-dot"
          enableSwipeMonths={true}
          allowSelectionOutOfRange={false}
          dayComponent={({ date, state }) => {
            const dateString = date.dateString;
            const dateEvents = events[dateString] || [];
            const isSelected = selectedDates.includes(dateString);
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const isDisabled = state.disabled;
            
            return (
              <View style={styles.dayComponentContainer}>
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    isSelected && styles.selectedDay,
                    isToday && styles.todayDay
                  ]}
                  onPress={() => handleDayPress({ dateString })}
                  disabled={isDisabled}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.dayText,
                    isDisabled && styles.disabledDayText,
                    isSelected && styles.selectedDayText,
                    isToday && styles.todayDayText
                  ]}>
                    {date.day}
                  </Text>
                </TouchableOpacity>
                
                {dateEvents.length > 0 && (
                  <View style={styles.eventDotsContainer}>
                    {dateEvents.slice(0, 3).map((event, idx) => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventDot,
                          { backgroundColor: getColorForEvent(event.id) }
                        ]}
                        onPress={() => {
                          handleEventPress(event);
                        }}
                        activeOpacity={0.6}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          theme={{
            todayTextColor: '#2196F3',
            todayBackgroundColor: 'transparent',
            selectedDayBackgroundColor: highlightColors[0],
            selectedDayTextColor: '#000',
            textDisabledColor: '#c0c0c0',
            dayTextColor: '#333',
            textSectionTitleColor: '#333',
            disabledArrowColor: '#d9e1e8',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textMonthFontSize: 18,
            monthTextColor: '#000',
          }}
          minDate={null}
          pastScrollRange={1}
          futureScrollRange={12}
          renderArrow={(direction) => (
            <AntDesign
              name={direction === 'left' ? 'left' : 'right'}
              size={20}
              color="#2196F3"
            />
          )}
        />
      </View>

      {showInlineForm && (
        <View style={styles.inlineFormContainer}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Event</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleInlineFormClose}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <EventFormScreen 
              startDate={startDate}
              endDate={endDate}
              event={currentEvent}
              events={events}
              onSave={handleInlineEventSave}
            />
          </View>
        </View>
      )}
      
      <View style={styles.createdEventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.sectionTitle}>Created Events</Text>
          <Text style={styles.eventsCountText}>
            {displayEvents.length > 0 ? `Showing ${displayEvents.length} of ${Object.values(events).flat().filter(event => !isPastDate(event.date)).length} events` : ''}
          </Text>
        </View>
        
        {displayEvents.length === 0 ? (
          <Text style={styles.noEventsText}>No upcoming events</Text>
        ) : (
          <>
            <FlatList
              data={displayEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id ? String(item.id) : `event-${item.date}-${item.startTime}`}
              style={styles.eventsList}
            />
            
            <TouchableOpacity
              style={styles.seeMoreButtonBottom}
              onPress={() => router.push('/schedules')}
            >
              <Text style={styles.seeMoreTextBottom}>See More</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
      
      {/* <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNew}
      >
        <AntDesign name="plus" size={24} color="#000" />
      </TouchableOpacity> */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 10, // Add padding at the top to prevent camera overlay
  },
  calendarSection: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  createdEventsSection: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    minHeight: 150,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsCountText: {
    fontSize: 14,
    color: '#888',
  },
  noEventsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  eventsList: {
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedEventCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventMenuButton: {
    padding: 4,
  },
  eventMenu: {
    position: 'absolute',
    right: 0,
    top: 30,
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  eventMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  eventMenuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  kebabMenu: {
    padding: 4,
    zIndex: 95, // Higher than backdrop but lower than dropdown
  },
  menuDropdown: {
    position: 'absolute',
    top: 35,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10, 
    padding: 4,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 99, // Increase zIndex to ensure it's above other content
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 160,
    overflow: 'hidden',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 90, // Make it higher than other elements but lower than dropdown
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eventIcon: {
    marginRight: 6,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventRepeat: {
    fontSize: 14,
    color: '#666',
  },
  pastEventText: {
    color: '#888',
  },
  seeMoreButtonBottom: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  seeMoreTextBottom: {
    color: '#2196F3',
    fontSize: 16,
  },
  // addButton: {
  //   position: 'absolute',
  //   right: 20,
  //   bottom: 20,
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   backgroundColor: '#fada5e',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   elevation: 5,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 3,
  // },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  weekdayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  dayComponentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  disabledDayText: {
    color: '#ccc',
  },
  selectedDay: {
    backgroundColor: '#ffcc00',
  },
  todayDay: {
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  selectedDayText: {
    color: '#000',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  eventDotsContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  inlineFormContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inlineFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inlineFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  eventMarkersContainer: {
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
  },
  eventMarker: {
    padding: 4,
    borderRadius: 4,
    marginVertical: 2,
    width: '90%',
  },
  eventMarkerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  moreEventsText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
});