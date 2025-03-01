import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { isPastDate, formatAlarmSetting, formatDateToFriendly } from '../utils/eventUtils';
import { AntDesign, MaterialIcons, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function EventDetailsScreen({ event, onEdit, onDelete, onDuplicate, onAddNewEvent }) {
  if (!event) {
    return (
      <View style={styles.containerWrapper}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No event data available</Text>
        </View>
      </View>
    );
  }
  
  const isPast = isPastDate(event.date);
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    if (isPast) {
      Alert.alert('Error', 'Cannot edit past events');
      return;
    }
    
    if (onEdit) {
      onEdit(event);
    }
  };

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
            }
          }
        }
      ]
    );
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(event);
    }
  };

  const handleAddNewEvent = () => {
    if (onAddNewEvent) {
      onAddNewEvent();
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
    <View style={styles.containerWrapper}>
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
            )}
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleDuplicate();
              }}
            >
              <MaterialCommunityIcons name="content-duplicate" size={20} color="#16A085" />
              <Text style={styles.menuItemText}>Duplicate Event</Text>
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
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    color: '#888',
  },
  statusText: {
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  activeStatusText: {
    color: '#34A853',
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
  },
  pastStatusText: {
    color: '#EA4335',
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    // backgroundColor: '#dcdcdc',
    backgroundColor: '#efcc00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 1002,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
}); 