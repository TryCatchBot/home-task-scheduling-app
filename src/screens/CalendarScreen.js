import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import { Calendar, CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import { loadEvents, saveEvents, isPastDate, loadAlarms, saveAlarms } from '../utils/eventUtils';
import { scheduleAlarmForEvent, cancelAlarmForEvent } from '../utils/alarmService';
import EventFormScreen from './EventFormScreen';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Toast function that works on both iOS and Android
const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, we'll use Alert as a simple alternative
    Alert.alert('Success', message, [{ text: 'OK' }], { cancelable: true });
  }
};

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

export default function CalendarScreen({ params, router, onEventSave, onEventDetails, onEditEvent, onDayPress }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  // Add state for showing event form inline
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [selectedFormDate, setSelectedFormDate] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
    const marked = {};
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Mark past dates as disabled
    const pastDates = {};
    const startOfYear = new Date(todayDate.getFullYear(), 0, 1);
    for (let day = new Date(startOfYear); day < todayDate; day.setDate(day.getDate() + 1)) {
      const dateString = day.toISOString().split('T')[0];
      pastDates[dateString] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: '#c0c0c0'
      };
    }
    
    // Mark the current date (today) - not disabled
    marked[todayDate.toISOString().split('T')[0]] = { 
      marked: eventData[todayDate.toISOString().split('T')[0]]?.length > 0, 
      dotColor: '#2196F3',
      selected: selectedDate === todayDate.toISOString().split('T')[0],
      selectedColor: highlightColors[0],
      selectedTextColor: '#000',
      today: true
    };
    
    // Mark dates with events and add event badges
    Object.keys(eventData).forEach(date => {
      if (eventData[date].length > 0) {
        // Check if the date is in the past
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);
        
        // Create dots for each event on this date
        const dots = eventData[date].map((event, idx) => ({
          key: event.id,
          color: getColorForEvent(event.id),
          selectedDotColor: '#FFFFFF'
        }));

        // Create badges/periods for each event
        const periods = eventData[date].map((event, idx) => ({
          startingDay: true,
          endingDay: true,
          color: getColorForEvent(event.id) + '30', // Add transparency
        }));
        
        if (eventDate < todayDate) {
          // Past date with events
          marked[date] = { 
            ...pastDates[date],
            marked: true,
            dots: dots,
            periods: periods
          };
        } else {
          // Current or future date with events
          marked[date] = { 
            ...marked[date],
            marked: true,
            dots: dots,
            periods: periods
          };
        }
      }
    });

    // Mark selected date range
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: highlightColors[0],
        selectedTextColor: '#000'
      };
    }

    // Merge past dates last to ensure they don't override selections
    Object.keys(pastDates).forEach(date => {
      if (!marked[date]) {
        marked[date] = pastDates[date];
      }
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    
    // Add a slight delay to ensure calendar renders properly
    setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.measure((fx, fy, width, height, px, py) => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              y: py - 120,
              animated: true
            });
          }
        });
      }
    }, 100);
    
    // Always show the inline form when a date is clicked
    setSelectedFormDate(dateString);
    setCurrentEvent(null);
    setIsEditing(false);
    setShowInlineForm(true);
    
    // Also call onDayPress if provided (for any other functionality)
    if (onDayPress) {
      onDayPress(dateString);
    }
  };

  const handleEventSave = async (startDate, endDate, eventData) => {
    const updatedEvents = { ...events };
    
    // Generate dates between start and end
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);
    const dates = [];
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Load existing alarm mappings
    const alarms = await loadAlarms();
    
    // Save event for each date with a unique ID for each
    const baseId = Date.now();
    const promises = dates.map(async (date, index) => {
      if (!updatedEvents[date]) {
        updatedEvents[date] = [];
      }
      
      // Check if event with same title already exists on this date
      const hasDuplicateTitle = updatedEvents[date].some(event => 
        event.title === eventData.title && 
        !event.id.includes(baseId) // Skip newly created events
      );
      
      if (!hasDuplicateTitle) {
        // Create a unique ID by combining the base timestamp with the index
        const uniqueId = `${baseId}-${index}`;
        const newEvent = { ...eventData, id: uniqueId, date };
        updatedEvents[date].push(newEvent);
        
        // Schedule alarm if enabled
        if (newEvent.alarm && newEvent.alarm !== 'none') {
          const notificationId = await scheduleAlarmForEvent(newEvent);
          if (notificationId) {
            alarms[uniqueId] = notificationId;
          }
        }
      } else {
        // Show warning but continue with other events
        showToast(`Warning: Event "${eventData.title}" already exists on ${new Date(date).toDateString()}`);
      }
    });
    
    // Wait for all promises to complete
    await Promise.all(promises);
    
    // Save events and alarms
    await saveEvents(updatedEvents);
    await saveAlarms(alarms);
    
    setEvents(updatedEvents);
    updateMarkedDates(updatedEvents);

    // Show success toast
    showToast(`Event "${eventData.title}" created successfully!`);

    // Scroll to created events
    setTimeout(() => {
      if (scrollRef.current && todayRef.current) {
        todayRef.current.measure((fx, fy, width, height, px, py) => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              y: py - 120,
              animated: true
            });
          }
        });
      }
    }, 500);
  };

  const handleEditEvent = (event) => {
    if (isPastDate(event.date)) {
      Alert.alert('Error', 'Cannot edit past events');
      return;
    }

    if (onEditEvent) {
      onEditEvent(event);
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
    const eventTitle = events[date]?.find(e => e.id === eventId)?.title || 'Event';
    const dateEvents = events[date]?.filter(e => e.id !== eventId) || [];
    const updatedEvents = {
      ...events,
      [date]: dateEvents,
    };
    
    // Cancel associated alarm
    const alarms = await loadAlarms();
    const notificationId = alarms[eventId];
    
    if (notificationId) {
      await cancelAlarmForEvent(notificationId);
      delete alarms[eventId];
      await saveAlarms(alarms);
    }
    
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
    updateMarkedDates(updatedEvents);
    
    // Show success toast
    showToast(`Event "${eventTitle}" deleted successfully!`);
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

  const renderEventCard = ({ item }) => {
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
              {!isPast && (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setOpenMenuId(null);
                    handleEditEvent(item);
                  }}
                >
                  <AntDesign name="edit" size={16} color="#2196F3" />
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenuId(null);
                  handleDeleteEvent(item.id, item.date);
                }}
              >
                <AntDesign name="delete" size={16} color="#ff4444" />
                <Text style={styles.menuItemText}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setOpenMenuId(null);
                  handleDuplicateEvent(item);
                }}
              >
                <AntDesign name="copy1" size={16} color="#16A085" />
                <Text style={styles.menuItemText}>Duplicate</Text>
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
              {item.repeat.charAt(0).toUpperCase() + item.repeat.slice(1)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render event markers for the calendar
  const renderEventMarker = (date) => {
    if (!events[date] || events[date].length === 0) return null;
    
    return (
      <View style={styles.eventMarkersContainer}>
        {events[date].slice(0, 3).map((event, idx) => (
          <View 
            key={event.id} 
            style={[
              styles.eventMarker, 
              { backgroundColor: getColorForEvent(event.id) }
            ]}
          >
            <Text style={styles.eventMarkerText}>
              {getTruncatedTitle(event.title, 10)}
            </Text>
          </View>
        ))}
        {events[date].length > 3 && (
          <Text style={styles.moreEventsText}>+{events[date].length - 3} more</Text>
        )}
      </View>
    );
  };

  const handleEventPress = (event) => {
    if (onEventDetails) {
      onEventDetails(event);
    }
  };

  const handleInlineFormClose = () => {
    setShowInlineForm(false);
  };
  
  const handleInlineEventSave = (startDate, endDate, eventData) => {
    // Save the event
    handleEventSave(startDate, endDate, eventData);
    // Close the form
    setShowInlineForm(false);
  };

  // Filter out past events from display in the Created Events section
  const getEventsForDisplay = () => {
    // Flatten events and filter out past events
    return Object.values(events)
      .flat()
      .filter(event => !isPastDate(event.date))
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA - dateB;
      });
  };

  // Get the filtered events for display
  const displayEvents = getEventsForDisplay();

  return (
    <ScrollView ref={scrollRef} style={styles.container}>
      <View style={styles.calendarSection}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="multi-period"
          theme={{
            todayTextColor: '#2196F3',
            todayBackgroundColor: '#e6f2ff',
            selectedDayBackgroundColor: highlightColors[0],
            selectedDayTextColor: '#000',
            textDisabledColor: '#c0c0c0',
            dayTextColor: '#333',
            textSectionTitleColor: '#666',
            disabledArrowColor: '#d9e1e8',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            'stylesheet.calendar.main': {
              selectedDay: {
                borderRadius: 20, // Make selected dates circular
                backgroundColor: highlightColors[0]
              }
            }
          }}
          minDate={null}
          disableAllTouchEventsForDisabledDays={true}
          pastScrollRange={1}
          futureScrollRange={12}
          disabledByDefault={false}
          renderArrow={(direction) => (
            <AntDesign
              name={direction === 'left' ? 'left' : 'right'}
              size={20}
              color="#2196F3"
            />
          )}
        />
      </View>

      {/* render event form here when user clicks on star date */}
      {showInlineForm && (
        <View style={styles.inlineFormContainer}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={handleInlineFormClose} style={styles.closeButton}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <EventFormScreen 
              startDate={selectedFormDate}
              endDate={selectedFormDate}
              event={currentEvent}
              events={events}
              isEditing={isEditing}
              onSave={handleInlineEventSave}
            />
          </View>
        </View>
      )}
      
      <View style={styles.createdEventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.sectionTitle}>Created Events</Text>
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => router.push('/schedules')}
          >
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>
        
        {displayEvents.length === 0 ? (
          <Text style={styles.noEventsText}>No upcoming events</Text>
        ) : (
          <>
            <FlatList
              data={displayEvents.slice(0, 5)}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id ? String(item.id) : `event-${item.date}-${item.startTime}`}
              style={styles.eventsList}
            />
            
            {displayEvents.length > 5 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/schedules')}
              >
                <Text style={styles.viewAllText}>View All Events</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventsList: {
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pastEventCard: {
    backgroundColor: '#e0e0e0',
  },
  pastEventText: {
    color: '#888',
  },
  eventContent: {
    padding: 16,
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventRepeat: {
    fontSize: 14,
    color: '#666',
  },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
    marginLeft: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  editIconButton: {
    backgroundColor: '#2196F3', // Blue
  },
  viewIconButton: {
    backgroundColor: '#16A085', // Teal
  },
  deleteIconButton: {
    backgroundColor: '#ff4444', // Red
  },
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
  seeMoreButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  seeMoreText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  eventMarkersContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    padding: 2,
  },
  eventMarker: {
    borderRadius: 4,
    padding: 2,
    marginBottom: 1,
    alignSelf: 'center',
  },
  eventMarkerText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
  },
  noEventsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventIcon: {
    marginRight: 6,
    width: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kebabMenu: {
    padding: 4,
    zIndex: 11,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
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
    zIndex: 11,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 160,
    overflow: 'hidden',
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
  inlineFormContainer: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    width: '100%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
}); 