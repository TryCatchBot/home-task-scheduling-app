import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isPastDate, formatAlarmSetting, formatDateToFriendly } from '../utils/eventUtils';
import { AntDesign, MaterialIcons, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EventDetailsScreen({ event, onDelete, onDuplicate, onAddNewEvent, onClose }) {
  if (!event) {
    return (
      <SafeAreaView style={styles.containerWrapper}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No event data available</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const isPast = isPastDate(event.date);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(event.id, event.date);
              // Explicitly call onClose to close the modal after deletion
              if (onClose) {
                onClose();
              }
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    // Close the menu
    setShowMenu(false);
    
    // Call onClose to close the details modal first
    if (onClose) {
      onClose();
    }
    
    // Navigate to the edit event screen with the event data
    router.push({
      pathname: '/newEvent',
      params: {
        event: JSON.stringify(event),
        date: event.date,
        isEditing: 'true'
      }
    });
  };

  const handleAddNewEvent = () => {
    if (onAddNewEvent) {
      onAddNewEvent();
      // Also close this screen when adding a new event
      if (onClose) {
        onClose();
      }
    } else {
      // If no callback is provided, use the router to navigate
      if (router) {
        router.push('/new');
      }
    }
  };

  // Get color for event badge - this should match the logic in CalendarScreen
  const getEventColor = () => {
    // Add a check to ensure event.id exists
    if (!event || !event.id) {
      return '#4285F4'; // Default to blue if no id is available
    }
    
    try {
      const idPart = event.id.split('-')[0];
      const index = Math.abs(parseInt(idPart) || 0) % 10; // Convert to number safely, default to 0 if NaN
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
    } catch (error) {
      // If any error occurs during color calculation, return a default color
      console.log('Error calculating event color:', error);
      return '#4285F4'; // Default blue
    }
  };

  return (
    <SafeAreaView style={styles.containerWrapper}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.container}>
        <View style={[styles.card, isPast && styles.pastCard, { borderLeftColor: getEventColor(), borderLeftWidth: 5 }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isPast && styles.pastText]}>
              {event.title || 'Untitled Event'}
            </Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
            >
              <Feather name="more-vertical" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={[styles.value, isPast && styles.pastText]}>
              {formatDateToFriendly(event.date) || 'No date specified'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Start Time:</Text>
            <Text style={[styles.value, isPast && styles.pastText]}>
              {event.startTime || 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>End Time:</Text>
            <Text style={[styles.value, isPast && styles.pastText]}>
              {event.endTime || 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Repeat:</Text>
            <Text style={[styles.value, isPast && styles.pastText]}>
              {event.repeat ? (event.repeat.charAt(0).toUpperCase() + event.repeat.slice(1)) : 'None'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Alarm:</Text>
            <Text style={[styles.value, isPast && styles.pastText]}>
              {formatAlarmSetting(event.alarm || 'none')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.statusText, isPast ? styles.pastStatusText : styles.activeStatusText]}>
              {isPast ? 'Past Event' : 'Upcoming Event'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating add button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNewEvent}
      >
        <AntDesign name="plus" size={24} color="#000" />
      </TouchableOpacity>

       

      {/* Menu Modal */}
      <Modal
        transparent={true}
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {!isPast && (
              <>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleEdit();
                  }}
                >
                  <MaterialIcons name="edit" size={20} color="#2196F3" />
                  <Text style={styles.menuItemText}>Edit Event</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                >
                  <MaterialIcons name="delete" size={20} color="#ff4444" />
                  <Text style={styles.menuItemText}>Delete Event</Text>
                </TouchableOpacity>
              </>
            )}
            
            {onDuplicate && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onDuplicate(event);
                }}
              >
                <Feather name="copy" size={20} color="#2196F3" />
                <Text style={styles.menuItemText}>Duplicate Event</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40, // Match the width of the back button for proper centering
  },
  backButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pastCard: {
    backgroundColor: '#e0e0e0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  menuButton: {
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pastText: {
    color: '#777',
  },
  statusText: {
    fontWeight: '600',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  activeStatusText: {
    color: '#34A853',
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
  },
  pastStatusText: {
    color: '#EA4335',
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
  },
  errorText: {
    fontSize: 16,
    color: '#EA4335',
    textAlign: 'center',
    marginTop: 20,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
}); 