import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { isPastDate, formatDateToFriendly } from '../utils/eventUtils';
import { useRouter } from 'expo-router';

export default function AllEventsScreen({ events, router, onEventDetails, onAddNewEvent, onDeleteEvent }) {
  const [groupedEvents, setGroupedEvents] = useState({});
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Process and group events by date and category (upcoming/past)
  useEffect(() => {
    console.log("AllEventsScreen received events:", 
      Array.isArray(events) ? events.length : typeof events);
    
    if (!Array.isArray(events)) {
      console.error("Events is not an array:", events);
      setUpcomingEvents([]);
      setPastEvents([]);
      return;
    }
    
    // Group events by date
    const grouped = {};
    const upcoming = [];
    const past = [];
    
    // Process all events into appropriate categories
    events.forEach(event => {
      if (!event) {
        console.warn("Skipping undefined event");
        return;
      }
      
      if (!event.date) {
        console.warn("Event missing date property:", event);
        return;
      }
      
      const isPast = isPastDate(event.date);
      
      // Add to grouped by date
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
      
      // Add to upcoming or past arrays
      if (isPast) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });
    
    // Sort upcoming events by date (earliest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Sort past events by date (most recent first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Grouped events: upcoming=${upcoming.length}, past=${past.length}`);
    
    setGroupedEvents(grouped);
    setUpcomingEvents(upcoming);
    setPastEvents(past);
  }, [events]);
  
  const handleEventPress = (event) => {
    setSelectedEventId(event.id);
    if (onEventDetails) {
      onEventDetails(event);
    }
  };
  
  const handleDeleteEvent = (eventId, date) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteEvent) {
              onDeleteEvent(eventId, date);
            }
          }
        }
      ]
    );
  };
  
  const handleEditEvent = (event) => {
    // Use event data for editing
    // Use router if available, otherwise use the onEventDetails function
    if (router) {
      // Navigate to newEvent instead of editEvent
      router.push({
        pathname: '/newEvent',
        params: {
          event: JSON.stringify(event),
          date: event.date || new Date().toISOString().split('T')[0],
          isEditing: 'true'
        }
      });
    } else if (onEventDetails) {
      // If router is not available, show event details
      onEventDetails(event);
    }
  };
  
  const renderEventItem = ({ item }) => {
    const isPast = isPastDate(item.date);
    
    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          isPast && styles.pastEventItem,
          selectedEventId === item.id && styles.selectedEventItem
        ]}
        onPress={() => handleEventPress(item)}
      >
        <View style={styles.eventContent}>
          {/* Color dot marker for the event */}
          <View 
            style={[
              styles.eventDot, 
              { backgroundColor: getEventColor(item.id) }
            ]} 
          />
          
          <View style={styles.eventTextContainer}>
            <Text style={[styles.eventTitle, isPast && styles.pastEventText]} numberOfLines={1}>
              {item.title || "Untitled Event"}
            </Text>
            
            <Text style={[styles.eventDate, isPast && styles.pastEventText]}>
              {formatDateToFriendly(item.date)}
              {item.startTime && item.endTime ? 
                ` · ${item.startTime.substring(0, 5)} - ${item.endTime.substring(0, 5)}` : 
                item.startTime ? ` · ${item.startTime.substring(0, 5)}` : ''}
            </Text>
          </View>
          
          <View style={styles.eventActions}>
            {!isPast && (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEditEvent(item)}
                >
                  <MaterialIcons name="edit" size={22} color="#2196F3" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteEvent(item.id, item.date)}
                >
                  <MaterialIcons name="delete" size={22} color="#ff4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Helper function to get a color for an event based on its ID
  const getEventColor = (eventId) => {
    if (!eventId) return '#4285F4'; // Default blue
    
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
    
    const idPart = eventId.split('-')[0];
    const index = Math.abs(parseInt(idPart) || 0) % badgeColors.length;
    return badgeColors[index];
  };
  
  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.eventCount}>{count} events</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={upcomingEvents.length > 0 ? upcomingEvents : []}
        renderItem={renderEventItem}
        keyExtractor={item => item.id || `temp-${Math.random()}`}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming events</Text>
            <TouchableOpacity 
              style={styles.addEventButton}
              onPress={onAddNewEvent}
            >
              <Text style={styles.addEventButtonText}>+ Add New Event</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          upcomingEvents.length > 0 && 
          renderSectionHeader('Upcoming Events', upcomingEvents.length)
        }
        ListFooterComponent={
          <>
            {pastEvents.length > 0 && (
              <>
                <TouchableOpacity 
                  style={styles.pastEventsToggle}
                  onPress={() => setShowPastEvents(!showPastEvents)}
                >
                  <Text style={styles.pastEventsToggleText}>
                    {showPastEvents ? 'Hide Past Events' : `Show Past Events (${pastEvents.length})`}
                  </Text>
                  <MaterialIcons 
                    name={showPastEvents ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {showPastEvents && (
                  <>
                    {renderSectionHeader('Past Events', pastEvents.length)}
                    {pastEvents.map(item => (
                      <View key={item.id} style={styles.pastEventWrapper}>
                        {renderEventItem({ item })}
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
            <View style={styles.footer} />
          </>
        }
      />
      
      {/* Floating add button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onAddNewEvent}
      >
        <View style={styles.addButtonContent}>
          <Text style={styles.addButtonText}>Add Event</Text>
          <AntDesign name="plus" size={24} color="#000" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  pastEventItem: {
    backgroundColor: '#f5f5f5',
    borderLeftColor: '#999',
  },
  selectedEventItem: {
    backgroundColor: '#e6f2ff',
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  pastEventText: {
    color: '#888',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  pastEventsToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
  },
  pastEventsToggleText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  pastEventWrapper: {
    opacity: 0.8,
  },
  footer: {
    height: 80, // Space for the floating button
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    minWidth: 140, // Make it wider to accommodate text
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fada5e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 9999, // Increase z-index to ensure visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    paddingHorizontal: 20, // Add padding for the content
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addEventButton: {
    backgroundColor: '#fada5e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between text and icon
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
}); 