import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ToastAndroid } from 'react-native';
import { isPastDate, RepeatOptions, formatDateToFriendly } from '../utils/eventUtils';
import { AntDesign, Entypo } from '@expo/vector-icons';

// Toast function that works on both iOS and Android
const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, we'll use Alert as a simple alternative
    Alert.alert('Success', message, [{ text: 'OK' }], { cancelable: true });
  }
};

export default function AllEventsScreen({ events = [], router, onEventDetails, onEditEvent, onAddNewEvent }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which menu is open

  useEffect(() => {
    // If events provided directly, use those
    filterEvents(selectedFilter);
  }, [selectedFilter, events]);

  const filterEvents = (filter) => {
    let eventsToFilter = [...events];
    
    // First filter by repeat type if needed
    if (filter !== 'all') {
      eventsToFilter = eventsToFilter.filter(event => event.repeat === filter);
    }
    
    // Sort events: upcoming events first, then past events
    eventsToFilter.sort((a, b) => {
      const isAPast = isPastDate(a.date);
      const isBPast = isPastDate(b.date);
      
      // If one is past and one is upcoming, prioritize the upcoming one
      if (isAPast && !isBPast) return 1;  // A is past, B is upcoming, so B comes first
      if (!isAPast && isBPast) return -1; // A is upcoming, B is past, so A comes first
      
      // If both are of the same type (both past or both upcoming), sort by date
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA - dateB;
    });
    
    setFilteredEvents(eventsToFilter);
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

  const handleDeleteEvent = (event) => {
    if (router) {
      router.replace({
        pathname: '/',
        params: {
          deleteEvent: 'true',
          eventId: event.id,
          eventDate: event.date
        }
      });
    }
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
              
              if (router) {
                router.replace({
                  pathname: '/',
                  params: {
                    duplicateEvent: JSON.stringify(newEvent),
                    eventDate: today
                  }
                });
              }
            },
          },
        ]
      );
    } else {
      // If it's a current or future event, keep the same date
      if (router) {
        router.replace({
          pathname: '/',
          params: {
            duplicateEvent: JSON.stringify(newEvent),
            eventDate: event.date
          }
        });
      }
    }
    
    // Show success toast
    showToast(`Event "${event.title}" duplicated successfully!`);
  };

  const handleAddNewEvent = () => {
    if (onAddNewEvent) {
      onAddNewEvent();
    } else if (router) {
      router.push('/');
    }
  };

  const handleEventPress = (event) => {
    if (openMenuId) {
      setOpenMenuId(null);
      return;
    }
    
    if (onEventDetails) {
      onEventDetails(event);
    }
  };

  const renderEventCard = ({ item }) => {
    const isPast = isPastDate(item.date);
    const isMenuOpen = openMenuId === item.id;
    
    // Get color for the event
    const getEventColor = () => {
      const index = Math.abs(item.id.split('-')[0]) % 10;
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
      return badgeColors[index];
    };
    
    const eventColor = getEventColor();
    
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
                  handleDeleteEvent(item);
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
              {formatDateToFriendly(item.date)}
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

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedFilter === 'all' && styles.activeTab]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.tabText, selectedFilter === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedFilter === RepeatOptions.WEEKLY && styles.activeTab]}
          onPress={() => setSelectedFilter(RepeatOptions.WEEKLY)}
        >
          <Text style={[styles.tabText, selectedFilter === RepeatOptions.WEEKLY && styles.activeTabText]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedFilter === RepeatOptions.BIWEEKLY && styles.activeTab]}
          onPress={() => setSelectedFilter(RepeatOptions.BIWEEKLY)}
        >
          <Text style={[styles.tabText, selectedFilter === RepeatOptions.BIWEEKLY && styles.activeTabText]}>Bi-Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedFilter === RepeatOptions.MONTHLY && styles.activeTab]}
          onPress={() => setSelectedFilter(RepeatOptions.MONTHLY)}
        >
          <Text style={[styles.tabText, selectedFilter === RepeatOptions.MONTHLY && styles.activeTabText]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedFilter === RepeatOptions.NONE && styles.activeTab]}
          onPress={() => setSelectedFilter(RepeatOptions.NONE)}
        >
          <Text style={[styles.tabText, selectedFilter === RepeatOptions.NONE && styles.activeTabText]}>None</Text>
        </TouchableOpacity>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id ? String(item.id) : `event-${item.date}-${item.startTime}`}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNewEvent}
      >
        <AntDesign name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fada5e',
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Add padding for the floating button
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fada5e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
}); 