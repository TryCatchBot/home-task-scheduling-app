import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RepeatOptions, AlarmOptions, hasTimeConflict, formatAlarmSetting } from '../utils/eventUtils';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import CalendarPicker from 'react-native-calendar-picker';
import { FontAwesome } from '@expo/vector-icons';

// EventForm component to be reused for multiple events
const EventForm = ({ 
  index, 
  eventData, 
  onUpdate, 
  onRemove, 
  showStartDatePicker,
  showEndDatePicker,
  showStartTimeModal,
  showEndTimeModal,
  showRepeatPicker,
  showAlarmPicker,
  setShowStartDatePicker,
  setShowEndDatePicker,
  setShowStartTimeModal,
  setShowEndTimeModal,
  setShowRepeatPicker,
  setShowAlarmPicker,
  currentIndex,
  setCurrentIndex,
  onRequestDateSelection,
  onAddEvent
}) => {
  
  // Add local state for alarm options modal
  const [showAlarmOptionsModal, setShowAlarmOptionsModal] = useState(false);
  
  // Log the event data when the component mounts
  useEffect(() => {
    console.log(`EventForm ${index} received data:`, {
      title: eventData.title,
      selectedStartDate: eventData.selectedStartDate,
      selectedEndDate: eventData.selectedEndDate,
      startTime: formatTime(eventData.startTime),
      endTime: formatTime(eventData.endTime),
      repeat: eventData.repeat,
      alarm: eventData.alarm,
      id: eventData.id,
    });
  }, []);
  
  const handleInputChange = (field, value) => {
    console.log(`Updating field ${field} to:`, value);
    if (typeof onUpdate === 'function') {
      onUpdate(index, { [field]: value });
    } else {
      console.error("onUpdate function not provided to EventForm component");
    }
  };

  const handleStartDatePress = () => {
    if (typeof onRequestDateSelection === 'function') {
      onRequestDateSelection(index, 'start');
    } else {
      console.error("onRequestDateSelection function not provided to EventForm component");
      if (typeof setShowStartDatePicker === 'function') {
        setShowStartDatePicker(true);
      }
    }
  };

  const handleEndDatePress = () => {
    if (typeof onRequestDateSelection === 'function') {
      onRequestDateSelection(index, 'end');
    } else {
      console.error("onRequestDateSelection function not provided to EventForm component");
      if (typeof setShowEndDatePicker === 'function') {
        setShowEndDatePicker(true);
      }
    }
  };

  const handleStartTimePress = () => {
    if (typeof setShowStartTimeModal === 'function') {
      setShowStartTimeModal(true);
    }
    if (typeof setCurrentIndex === 'function') {
      setCurrentIndex(index);
    }
  };

  const handleEndTimePress = () => {
    if (typeof setShowEndTimeModal === 'function') {
      setShowEndTimeModal(true);
    }
    if (typeof setCurrentIndex === 'function') {
      setCurrentIndex(index);
    }
  };

  const handleRepeatPress = () => {
    if (typeof setShowRepeatPicker === 'function') {
      setShowRepeatPicker(true);
    }
    if (typeof setCurrentIndex === 'function') {
      setCurrentIndex(index);
    }
  };

  const handleAlarmPress = () => {
    if (typeof setShowAlarmPicker === 'function') {
      setShowAlarmPicker(true);
    }
    if (typeof setCurrentIndex === 'function') {
      setCurrentIndex(index);
    }
  };

  // Safely handle onRemove function call
  const handleRemove = () => {
    if (typeof onRemove === 'function') {
      onRemove(index);
    } else {
      console.error("onRemove function not provided to EventForm component");
    }
  };

  // Handles adding a new event form
  const handleAdd = () => {
    if (typeof onAddEvent === 'function') {
      onAddEvent();
    } else {
      console.error("onAddEvent function not provided to EventForm component");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Select date';
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '00:00';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Get UI color styles based on whether this form is currently selected
  const getActiveStyles = () => {
    const isActive = currentIndex === index;
    return {
      borderColor: isActive ? '#007AFF' : '#E0E0E0',
      backgroundColor: isActive ? '#F0F8FF' : 'white',
    };
  };
  
  const handleRepeatChange = (value) => {
    handleInputChange('repeat', value);
    setShowRepeatPicker(false);
  };
  
  const handleAlarmOptionsPress = () => {
    setCurrentIndex(index);
    setShowAlarmOptionsModal(true);
  };
  
  const handleAlarmChange = (value) => {
    handleInputChange('alarm', value);
    setShowAlarmOptionsModal(false);
  };

  const handleCalendarDayPress = (selectedDate) => {
    // Skip if trying to select a past date
    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < todayObj) {
      Alert.alert('Error', 'Cannot select past dates');
      return; // Don't allow selection of past dates
    }
    
    // Convert the date to ISO string format and extract the date part
    const dateString = selectedDateObj.toISOString().split('T')[0];
    
    const updatedForms = [...eventData];
    const currentForm = { ...updatedForms[currentIndex] };
    
    if (currentField === 'start') {
      currentForm.selectedStartDate = dateString;
    } else if (currentField === 'end') {
      // Validate end date is not before start date
      if (new Date(currentForm.selectedStartDate) > selectedDateObj) {
        Alert.alert('Error', 'End date cannot be before start date');
        return;
      }
      currentForm.selectedEndDate = dateString;
    }
    
    updatedForms[currentIndex] = currentForm;
    handleInputChange('selectedStartDate', dateString);
    handleInputChange('selectedEndDate', dateString);
    handleInputChange('startTime', new Date(dateString));
    handleInputChange('endTime', new Date(dateString));
  };

  const handleStartTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const updatedForms = [...eventData];
      const currentForm = { ...updatedForms[currentIndex] };
      
      currentForm.startTime = selectedTime;
      
      // Ensure end time is after start time
      if (selectedTime >= currentForm.endTime) {
        const newEndTime = new Date(selectedTime);
        newEndTime.setHours(selectedTime.getHours() + 1);
        currentForm.endTime = newEndTime;
      }
      
      updatedForms[currentIndex] = currentForm;
      handleInputChange('startTime', selectedTime);
      handleInputChange('endTime', currentForm.endTime);
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const currentForm = eventData;
      if (selectedTime <= currentForm.startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      
      const updatedForms = [...eventData];
      updatedForms[currentIndex] = {
        ...currentForm,
        endTime: selectedTime
      };
      handleInputChange('endTime', selectedTime);
    }
  };

  const handleRequestDateSelection = (index, field) => {
    setCurrentIndex(index);
    setCurrentField(field);
    
    if (onRequestDateSelection) {
      onRequestDateSelection(index, field);
    } else {
      // When in modal mode, show calendar in modal
      setShowCalendarModal(true);
    }
  };

  // Platform-specific rendering for dropdowns
  const renderRepeatDropdown = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webSelectContainer}>
          <select 
            value={eventData.repeat}
            onChange={(e) => {
              handleInputChange('repeat', e.target.value);
            }}
            className="webSelect"
            style={{
              fontSize: '16px',
              padding: '12px',
              width: '100%',
              borderRadius: '8px',
              borderColor: '#ddd',
              backgroundColor: 'white'
            }}
          >
            <option value={RepeatOptions.NONE}>None</option>
            <option value={RepeatOptions.WEEKLY}>Weekly</option>
            <option value={RepeatOptions.BIWEEKLY}>Bi-weekly</option>
            <option value={RepeatOptions.MONTHLY}>Monthly</option>
          </select>
        </View>
      );
    }
    
    return (
      <>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={handleRepeatPress}
        >
          <Text style={styles.dropdownText}>
            {eventData.repeat ? (eventData.repeat.charAt(0).toUpperCase() + eventData.repeat.slice(1)) : 'None'}
          </Text>
          <AntDesign 
            name={showRepeatPicker && currentIndex === index ? "up" : "down"} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {showRepeatPicker && currentIndex === index && (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={eventData.repeat}
              onValueChange={handleRepeatChange}
              style={styles.picker}
            >
              <Picker.Item label="None" value={RepeatOptions.NONE} />
              <Picker.Item label="Weekly" value={RepeatOptions.WEEKLY} />
              <Picker.Item label="Bi-weekly" value={RepeatOptions.BIWEEKLY} />
              <Picker.Item label="Monthly" value={RepeatOptions.MONTHLY} />
            </Picker>
          </View>
        )}
      </>
    );
  }
  
  const renderAlarmSection = () => {
    const isAlarmOn = eventData.alarm !== AlarmOptions.NONE;
    
    // Only display alarm section if a title has been entered
    if (!eventData.title || eventData.title.trim() === '') {
      return null;
    }
    
    return (
      <>
        <View style={styles.alarmSwitchRow}>
          <Text style={styles.alarmSwitchLabel}>Alarm</Text>
          <View style={styles.alarmSwitchContainer}>
            {isAlarmOn && (
              <Text style={styles.alarmOptionsText}>
                {formatAlarmSetting(eventData.alarm)}
              </Text>
            )}
            <Switch
              trackColor={{ false: "#e0e0e0", true: "#fada5e" }}
              thumbColor={isAlarmOn ? "#efc800" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
              onValueChange={handleAlarmPress}
              value={isAlarmOn}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.createNewEventContainer}
          onPress={handleAdd}
        >
          <AntDesign name="pluscircle" size={20} color="#efc800" />
          <Text style={styles.createNewEventText}>Create New Event</Text>
        </TouchableOpacity>
        
        {/* Alarm Options Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAlarmOptionsModal}
          onRequestClose={() => setShowAlarmOptionsModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowAlarmOptionsModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Alarm Options</Text>
              
              <ScrollView style={styles.alarmOptionsList}>
                {Object.values(AlarmOptions).map((option) => (
                  option !== AlarmOptions.NONE && (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.alarmOptionItem,
                        eventData.alarm === option && styles.selectedAlarmOption
                      ]}
                      onPress={() => handleAlarmChange(option)}
                    >
                      <Text style={styles.alarmOptionText}>
                        {formatAlarmSetting(option)}
                      </Text>
                      {eventData.alarm === option && (
                        <AntDesign name="check" size={18} color="#efc800" />
                      )}
                    </TouchableOpacity>
                  )
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeIconButton}
                onPress={() => setShowAlarmOptionsModal(false)}
              >
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }
  
  return (
    <View style={styles.eventFormContainer}>
      {index > 0 && (
        <TouchableOpacity 
          style={styles.removeEventButton} 
          onPress={handleRemove}
        >
          <View style={styles.closeIconContainer}>
            <AntDesign name="close" size={20} color="#ff4444" />
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.formRow}>
        <Text style={styles.label}>Event Name:</Text>
        <TextInput
          style={styles.input}
          value={eventData.title}
          onChangeText={(text) => handleInputChange('title', text)}
          placeholder="Enter event title"
          modifiable={false}
        />
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeLabel}>Start Date:</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={handleStartDatePress}
        >
          <TextInput
            pointerEvents="none"
            style={styles.dateInput}
            value={formatDate(eventData.selectedStartDate)}
            onChangeText={(text) => handleInputChange('selectedStartDate', text)}
            placeholder="YYYY-MM-DD"
          />
          <FontAwesome name="calendar" size={20} color="#888" style={styles.calendarIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeLabel}>End Date:</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={handleEndDatePress}
        >
          <TextInput
            pointerEvents="none"
            style={styles.dateInput}
            value={formatDate(eventData.selectedEndDate)}
            onChangeText={(text) => handleInputChange('selectedEndDate', text)}
            placeholder="YYYY-MM-DD"
          />
          <FontAwesome name="calendar" size={20} color="#888" style={styles.calendarIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeLabel}>Start Time:</Text>
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={handleStartTimePress}
        >
          <Text style={styles.timeText}>
            {eventData.startTime instanceof Date 
              ? formatTime(eventData.startTime) 
              : (typeof eventData.startTime === 'string' ? eventData.startTime : '00:00')}
          </Text>
          <FontAwesome name="clock-o" size={20} color="#888" style={styles.clockIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeLabel}>End Time:</Text>
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={handleEndTimePress}
        >
          <Text style={styles.timeText}>
            {eventData.endTime instanceof Date 
              ? formatTime(eventData.endTime) 
              : (typeof eventData.endTime === 'string' ? eventData.endTime : '00:00')}
          </Text>
          <FontAwesome name="clock-o" size={20} color="#888" style={styles.clockIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Repeat:</Text>
        {renderRepeatDropdown()}
      </View>

      <View style={styles.formRow}>
        {renderAlarmSection()}
      </View>
    </View>
  );
};

export default function EventFormScreen({ startDate, endDate, onSave, events, event, onSelectDatesForEventIndex, allowModification = false }) {
  console.log("EventFormScreen rendering with event:", event);
  
  // Create a comprehensive initial form based on the event prop
  const initialEventForm = useMemo(() => {
    // Use all available data sources to create a complete initial form
    return {
      title: event?.title || '',
      selectedStartDate: startDate || event?.startDate || event?.date || '',
      selectedEndDate: endDate || event?.endDate || event?.date || '',
      startTime: event?.startTime ? parseTimeString(event.startTime) : new Date(),
      endTime: event?.endTime ? parseTimeString(event.endTime) : new Date(new Date().setHours(new Date().getHours() + 1)),
      repeat: event?.repeat || RepeatOptions.NONE,
      alarm: event?.alarm || AlarmOptions.NONE,
      id: event?.id || null,
      relatedDates: event?.relatedDates || []
    };
  }, [event, startDate, endDate]);
  
  // Ref to track initialization status to prevent unnecessary updates
  const isInitializedRef = useRef(false);
  
  // State for managing multiple event forms
  const [eventForms, setEventForms] = useState([initialEventForm]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentField, setCurrentField] = useState(null); // 'start' or 'end'
  
  // State for selected dates from calendar
  const [selectedDates, setSelectedDates] = useState(initialEventForm.relatedDates || []);
  const [selectedFormDate, setSelectedFormDate] = useState(initialEventForm.selectedStartDate || null);
  
  // States for pickers and modals
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // Form validation state
  const [isFormValid, setIsFormValid] = useState(false);

  // Use a ref to store the last save timestamp to prevent multiple saves
  const lastSaveTimeRef = useRef(0);

  // Parse time strings like "14:30" into Date objects
  function parseTimeString(timeStr) {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error("Error parsing time string:", error);
      return new Date(); // Return current time as fallback
    }
  }

  // Validate all forms
  useEffect(() => {
    const isValid = eventForms.every(form => 
      form.title.trim() !== '' &&
      form.selectedStartDate !== '' &&
      form.startTime instanceof Date &&
      !isNaN(form.startTime.getTime()) &&
      form.endTime instanceof Date &&
      !isNaN(form.endTime.getTime())
    );
    setIsFormValid(isValid);
  }, [eventForms]);

  // Initialize the form data only once using a ref flag
  useEffect(() => {
    if (isInitializedRef.current) {
      console.log("Form already initialized, skipping initialization");
      return;
    }
    
    console.log("Initializing form with event data:", event);
    
    // Only set the initial values when the component mounts
    if (event) {
      console.log("Setting form data from event:", event);
      
      // Make sure we have valid dates and times
      const formData = {
        title: event.title || '',
        selectedStartDate: startDate || event.startDate || event.date || '',
        selectedEndDate: endDate || event.endDate || event.date || '',
        startTime: event.startTime ? parseTimeString(event.startTime) : new Date(),
        endTime: event.endTime ? parseTimeString(event.endTime) : new Date(new Date().setHours(new Date().getHours() + 1)),
        repeat: event.repeat || RepeatOptions.NONE,
        alarm: event.alarm || AlarmOptions.NONE,
        id: event.id
      };
      
      console.log("Created form data:", formData);
      setEventForms([formData]);
      
      // If the event has multiple dates, set them
      if (event.relatedDates && Array.isArray(event.relatedDates)) {
        setSelectedDates(event.relatedDates);
      }
      
      isInitializedRef.current = true;
    }
  }, [event, startDate, endDate]); // Only depend on the necessary props

  // Add a useEffect to log the state of the form after it's set up
  useEffect(() => {
    // Log when the form is ready with all data
    if (eventForms.length > 0 && eventForms[0].title) {
      console.log("EventFormScreen is ready with form data:", {
        title: eventForms[0].title,
        startDate: eventForms[0].selectedStartDate,
        endDate: eventForms[0].selectedEndDate,
        forms: eventForms.length
      });
    }
  }, [eventForms]);

  // Handle the saving of the event, with rate limiting to prevent infinite loop issues
  const handleEventSave = async () => {
    // Prevent multiple rapid executions of this function
    const now = Date.now();
    if (lastSaveTimeRef.current && (now - lastSaveTimeRef.current < 500)) {
      console.log('Preventing multiple rapid save attempts');
      return;
    }
    lastSaveTimeRef.current = now;
    
    console.log('handleEventSave called with:', {
      eventFormsCount: eventForms.length,
    });

    // If no forms, do nothing
    if (eventForms.length === 0) {
      console.log("No event forms to save");
      return;
    }

    // Keep track of required field validations for each form
    const validations = [];
    const invalidForms = [];

    // Check each form for required fields
    eventForms.forEach((form, index) => {
      // Start with an empty validation object for this form
      const validation = {};
      
      // Check required fields
      if (!form.title || form.title.trim() === '') {
        validation.title = 'Title is required';
      }
      
      // Check date fields - use selectedDates if available
      if (!form.selectedStartDate && !selectedFormDate && (!selectedDates || selectedDates.length === 0)) {
        validation.startDate = 'Start date is required';
      }
      
      // Store the validation result for this form
      validations.push(validation);
      
      // Track forms with missing required fields
      if (Object.keys(validation).length > 0) {
        invalidForms.push(index + 1); // Forms are 1-indexed for the user
      }
    });

    // If any forms have validation issues, alert the user and don't save
    if (invalidForms.length > 0) {
      // Create a message that specifically identifies which forms have issues
      const pluralForms = invalidForms.length > 1;
      const formNumbers = invalidForms.join(', ');
      const message = `Form${pluralForms ? 's' : ''} ${formNumbers} ${pluralForms ? 'have' : 'has'} missing required fields. Please complete all required fields (title and date).`;
      Alert.alert('Required Fields Missing', message);
      
      // Update the validation state to show errors in the UI
      setIsFormValid(false);
      return;
    }

    // Call the save function safely
    prepareSaveEvents();
  };

  const prepareSaveEvents = () => {
    // Prepare all event data with deep copies to prevent reference issues
    const eventsToSave = eventForms.map(form => {
      // Create a new object for each event to avoid reference issues
      const eventCopy = {
        ...form,
        title: form.title,
        repeat: form.repeat || 'none',
        alarm: form.alarm || 'none',
        startTime: formatTime(form.startTime ? new Date(form.startTime.getTime()) : new Date()),
        endTime: formatTime(form.endTime ? new Date(form.endTime.getTime()) : new Date()),
        date: form.selectedStartDate || selectedFormDate,
        startDate: form.selectedStartDate || selectedFormDate,
        endDate: form.selectedEndDate || form.selectedStartDate || selectedFormDate,
      };
      return eventCopy;
    });

    console.log(`Prepared ${eventsToSave.length} events to save with unique references`);

    // If we're updating a single event, handle it directly
    if (eventForms.length === 1) {
      saveEvents(eventsToSave[0]);
    } else {
      // Otherwise, save all events at once
      saveEvents(eventsToSave);
    }
  };

  const saveEvents = (eventData) => {
    try {
      console.log("saveEvents called with:", typeof eventData, Array.isArray(eventData));
      
      // Create a deep copy of the event to avoid modifying the original
      let eventsToSave;
      
      if (Array.isArray(eventData)) {
        // Handle an array of events
        eventsToSave = eventData.map(event => ({ ...event }));
      } else if (typeof eventData === 'object' && eventData !== null) {
        // Handle a single event object
        eventsToSave = { ...eventData };
        
        // Ensure we preserve the ID when updating
        if (event && event.id) {
          eventsToSave.id = event.id;
        }
      } else {
        // Invalid data type
        console.error('Invalid event data format:', typeof eventData);
        Alert.alert('Error', 'Invalid event data format. Please try again.');
        return;
      }
      
      // Use a setTimeout to ensure this happens after current execution completes
      // This breaks the potential infinite loop by delaying the update
      setTimeout(() => {
        if (typeof onSave === 'function') {
          // Pass the start and end dates along with the event data
          const selectedEvent = Array.isArray(eventsToSave) ? eventsToSave[0] : eventsToSave;
          const startDateToUse = selectedEvent.selectedStartDate || selectedEvent.date || startDate;
          const endDateToUse = selectedEvent.selectedEndDate || selectedEvent.endDate || selectedEvent.date || endDate;
          
          console.log('Calling onSave with:', startDateToUse, endDateToUse, selectedEvent);
          onSave(startDateToUse, endDateToUse, eventsToSave);
        } else {
          console.error('onSave is not a function or not provided');
          Alert.alert('Error', 'Cannot save event data. Please try again.');
        }
      }, 0);
      
    } catch (error) {
      console.error('Error in saveEvents:', error);
      Alert.alert('Error', 'Failed to save event data. Please try again.');
    }
  };

  const renderTimePicker = (time, onChange, onConfirm) => {
    return (
      <DateTimePicker
        value={time}
        mode="time"
        display="spinner"
        onChange={onChange}
        style={styles.timePicker}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {eventForms.map((form, index) => (
          <EventForm
            key={index}
            index={index}
            eventData={form}
            onUpdate={(i, data) => {
              const updatedForms = [...eventForms];
              updatedForms[i] = { ...updatedForms[i], ...data };
              setEventForms(updatedForms);
            }}
            onRemove={(i) => {
              const updatedForms = [...eventForms];
              updatedForms.splice(i, 1);
              setEventForms(updatedForms);
            }}
            showStartDatePicker={showStartDatePicker && currentIndex === index}
            showEndDatePicker={showEndDatePicker && currentIndex === index}
            showStartTimeModal={showStartTimeModal && currentIndex === index}
            showEndTimeModal={showEndTimeModal && currentIndex === index}
            showRepeatPicker={showRepeatPicker}
            showAlarmPicker={showAlarmPicker}
            setShowStartDatePicker={(value) => {
              setShowStartDatePicker(value);
              setCurrentIndex(index);
            }}
            setShowEndDatePicker={(value) => {
              setShowEndDatePicker(value);
              setCurrentIndex(index);
            }}
            setShowStartTimeModal={(value) => {
              setShowStartTimeModal(value);
              setCurrentIndex(index);
            }}
            setShowEndTimeModal={(value) => {
              setShowEndTimeModal(value);
              setCurrentIndex(index);
            }}
            setShowRepeatPicker={(value) => {
              setShowRepeatPicker(value);
              setCurrentIndex(index);
            }}
            setShowAlarmPicker={(value) => {
              setShowAlarmPicker(value);
              setCurrentIndex(index);
            }}
            currentIndex={currentIndex}
            setCurrentIndex={(value) => {
              setCurrentIndex(value);
            }}
            onRequestDateSelection={(i, field) => {
              setCurrentIndex(i);
              setCurrentField(field);
              if (onSelectDatesForEventIndex) {
                onSelectDatesForEventIndex(i);
              } else {
                setShowCalendarModal(true);
              }
            }}
            onAddEvent={() => {
              handleAdd();
            }}
          />
        ))}
        
        <TouchableOpacity
          style={[
            styles.createButton, 
            !isFormValid && styles.createButtonDisabled
          ]}
          onPress={handleEventSave}
          disabled={!isFormValid}
        >
          <AntDesign name="save" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Save</Text>
        </TouchableOpacity>

        {showStartDatePicker && (
          <DateTimePicker
            value={new Date(eventForms[currentIndex].selectedStartDate || new Date())}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              setShowCalendarModal(false);
              if (selectedDate) {
                const dateString = selectedDate.toISOString().split('T')[0];
                const updatedForms = [...eventForms];
                const currentForm = { ...updatedForms[currentIndex] };
                
                currentForm.selectedStartDate = dateString;
                
                updatedForms[currentIndex] = currentForm;
                setEventForms(updatedForms);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={new Date(eventForms[currentIndex].selectedEndDate || eventForms[currentIndex].selectedStartDate || new Date())}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              setShowCalendarModal(false);
              if (selectedDate) {
                const currentForm = eventForms[currentIndex];
                if (new Date(currentForm.selectedStartDate) > selectedDate) {
                  Alert.alert('Error', 'End date cannot be before start date');
                  return;
                }
                
                const dateString = selectedDate.toISOString().split('T')[0];
                const updatedForms = [...eventForms];
                updatedForms[currentIndex] = {
                  ...currentForm,
                  selectedEndDate: dateString
                };
                setEventForms(updatedForms);
              }
            }}
            minimumDate={new Date(eventForms[currentIndex].selectedStartDate || new Date())}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showStartTimeModal}
          onRequestClose={() => setShowStartTimeModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowStartTimeModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Start Time</Text>
              {renderTimePicker(
                eventForms[currentIndex].startTime,
                (event, selectedTime) => {
                  setShowStartTimeModal(false);
                  const updatedForms = [...eventForms];
                  const currentForm = { ...updatedForms[currentIndex] };
                  
                  currentForm.startTime = selectedTime;
                  
                  // Ensure end time is after start time
                  if (selectedTime >= currentForm.endTime) {
                    const newEndTime = new Date(selectedTime);
                    newEndTime.setHours(selectedTime.getHours() + 1);
                    currentForm.endTime = newEndTime;
                  }
                  
                  updatedForms[currentIndex] = currentForm;
                  setEventForms(updatedForms);
                },
                () => setShowStartTimeModal(false)
              )}
            </View>
          </Pressable>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showEndTimeModal}
          onRequestClose={() => setShowEndTimeModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowEndTimeModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select End Time</Text>
              {renderTimePicker(
                eventForms[currentIndex].endTime,
                (event, selectedTime) => {
                  setShowEndTimeModal(false);
                  const updatedForms = [...eventForms];
                  const currentForm = { ...updatedForms[currentIndex] };
                  
                  currentForm.endTime = selectedTime;
                  
                  // Ensure end time is after start time
                  if (selectedTime <= currentForm.startTime) {
                    const newEndTime = new Date(selectedTime);
                    newEndTime.setHours(selectedTime.getHours() + 1);
                    currentForm.endTime = newEndTime;
                  }
                  
                  updatedForms[currentIndex] = currentForm;
                  setEventForms(updatedForms);
                },
                () => setShowEndTimeModal(false)
              )}
            </View>
          </Pressable>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showCalendarModal}
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowCalendarModal(false)}
          >
            <View style={styles.calendarModalContent}>
              <Text style={styles.modalTitle}>
                Select {currentField === 'start' ? 'Start' : 'End'} Date
              </Text>
              <CalendarPicker
                onDateChange={(selectedDate) => {
                  handleCalendarDayPress(selectedDate);
                }}
                minDate={new Date()}
                selectedDayColor="#fada5e"
                selectedDayTextColor="#000"
                todayBackgroundColor="#e6f2ff"
                todayTextStyle={{color: '#2196F3'}}
                textStyle={{color: '#333'}}
                disabledDates={(date) => {
                  return date.isBefore(new Date(), 'day');
                }}
                previousComponent={
                  <AntDesign name="left" size={20} color="#2196F3" />
                }
                nextComponent={
                  <AntDesign name="right" size={20} color="#2196F3" />
                }
              />
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.confirmButtonText}>Close Calendar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  titleContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 100,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  timePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  calendarIcon: {
    marginLeft: 8,
  },
  clockIcon: {
    marginLeft: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionValue: {
    fontSize: 16,
    color: '#666',
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#efc800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeEventButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeIconContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    padding: 5,
  },
  createNewEventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  createNewEventText: {
    color: '#000',
    fontSize: 16,
    marginLeft: 8,
  },
  webSelectContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  pickerItem: {
    marginVertical: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timePicker: {
    height: 200,
    width: '100%',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#efc800',
    borderColor: '#efc800',
  },
  cancelButton: {
    backgroundColor: '#fff',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
  },
  calendarModal: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  eventFormContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  formRow: {
    marginBottom: 16,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  alarmSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alarmSwitchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 10,
  },
  alarmOptionsText: {
    fontSize: 16,
    color: '#333',
  },
  alarmOptionsList: {
    maxHeight: 200,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 0,
  },
  alarmOptionItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  selectedAlarmOption: {
    backgroundColor: '#e0e0e0',
    borderColor: '#efc800',
    borderWidth: 2,
  },
  alarmOptionText: {
    fontSize: 16,
    color: '#333',
  },
  closeIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  calendarModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#efc800',
    borderColor: '#efc800',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
