import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RepeatOptions, AlarmOptions, hasTimeConflict, formatAlarmSetting } from '../utils/eventUtils';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import CalendarPicker from 'react-native-calendar-picker';

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
  isEditing
}) => {
  
  const handleStartDatePress = () => {
    setCurrentIndex(index);
    if (onRequestDateSelection) {
      onRequestDateSelection(index, 'start');
    } else {
      setShowStartDatePicker(true);
    }
  };
  
  const handleEndDatePress = () => {
    setCurrentIndex(index);
    if (onRequestDateSelection) {
      onRequestDateSelection(index, 'end');
    } else {
      setShowEndDatePicker(true);
    }
  };
  
  const handleStartTimePress = () => {
    setCurrentIndex(index);
    setShowStartTimeModal(true);
  };
  
  const handleEndTimePress = () => {
    setCurrentIndex(index);
    setShowEndTimeModal(true);
  };
  
  const handleRepeatPress = () => {
    setCurrentIndex(index);
    setShowRepeatPicker(!showRepeatPicker && currentIndex === index);
  };
  
  const handleAlarmPress = () => {
    setCurrentIndex(index);
    setShowAlarmPicker(!showAlarmPicker && currentIndex === index);
  };
  
  const handleRepeatChange = (value) => {
    onUpdate(index, { ...eventData, repeat: value });
    setShowRepeatPicker(false);
  };
  
  const handleAlarmChange = (value) => {
    onUpdate(index, { ...eventData, alarm: value });
    setShowAlarmPicker(false);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleStartDateChange = (text) => {
    try {
      // Allow user to type date manually - basic validation
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        onUpdate(index, { 
          ...eventData, 
          selectedStartDate: date.toISOString().split('T')[0] 
        });
      }
    } catch (e) {
      // Ignore invalid dates
    }
  };

  const handleEndDateChange = (text) => {
    try {
      // Allow user to type date manually - basic validation
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        onUpdate(index, { 
          ...eventData, 
          selectedEndDate: date.toISOString().split('T')[0] 
        });
      }
    } catch (e) {
      // Ignore invalid dates
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
              onUpdate(index, { ...eventData, repeat: e.target.value });
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
            {eventData.repeat.charAt(0).toUpperCase() + eventData.repeat.slice(1)}
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
  
  const renderAlarmDropdown = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webSelectContainer}>
          <select 
            value={eventData.alarm}
            onChange={(e) => {
              onUpdate(index, { ...eventData, alarm: e.target.value });
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
            <option value={AlarmOptions.NONE}>No Alarm</option>
            <option value={AlarmOptions.AT_TIME}>At time of event</option>
            <option value={AlarmOptions.FIVE_MIN}>5 minutes before</option>
            <option value={AlarmOptions.FIFTEEN_MIN}>15 minutes before</option>
            <option value={AlarmOptions.THIRTY_MIN}>30 minutes before</option>
            <option value={AlarmOptions.ONE_HOUR}>1 hour before</option>
            <option value={AlarmOptions.ONE_DAY}>1 day before</option>
          </select>
        </View>
      );
    }
    
    return (
      <>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={handleAlarmPress}
        >
          <Text style={styles.dropdownText}>
            {formatAlarmSetting(eventData.alarm)}
          </Text>
          <AntDesign 
            name={showAlarmPicker && currentIndex === index ? "up" : "down"} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {showAlarmPicker && currentIndex === index && (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={eventData.alarm}
              onValueChange={handleAlarmChange}
              style={styles.picker}
            >
              <Picker.Item label="No Alarm" value={AlarmOptions.NONE} />
              <Picker.Item label="At time of event" value={AlarmOptions.AT_TIME} />
              <Picker.Item label="5 minutes before" value={AlarmOptions.FIVE_MIN} />
              <Picker.Item label="15 minutes before" value={AlarmOptions.FIFTEEN_MIN} />
              <Picker.Item label="30 minutes before" value={AlarmOptions.THIRTY_MIN} />
              <Picker.Item label="1 hour before" value={AlarmOptions.ONE_HOUR} />
              <Picker.Item label="1 day before" value={AlarmOptions.ONE_DAY} />
            </Picker>
          </View>
        )}
      </>
    );
  }
  
  return (
    <View style={styles.eventFormContainer}>
      {index > 0 && (
        <TouchableOpacity 
          style={styles.removeEventButton} 
          onPress={() => onRemove(index)}
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
          onChangeText={(text) => onUpdate(index, { ...eventData, title: text })}
          placeholder="Enter event name"
          maxLength={50}
        />
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.inlineLabel}>Start:</Text>
        <TouchableOpacity 
          style={styles.dateTimeInput}
          onPress={handleStartDatePress}
        >
          <TextInput
            style={styles.dateText}
            value={formatDate(eventData.selectedStartDate)}
            onChangeText={handleStartDateChange}
            placeholder="Date"
            editable={true}
          />
          <AntDesign name="calendar" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={handleStartTimePress}
        >
          <Text style={styles.timeText}>{formatTime(eventData.startTime)}</Text>
          <Ionicons name="time-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeRow}>
        <Text style={styles.inlineLabel}>End:</Text>
        <TouchableOpacity 
          style={styles.dateTimeInput}
          onPress={handleEndDatePress}
        >
          <TextInput
            style={styles.dateText}
            value={formatDate(eventData.selectedEndDate)}
            onChangeText={handleEndDateChange}
            placeholder="Date"
            editable={true}
          />
          <AntDesign name="calendar" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={handleEndTimePress}
        >
          <Text style={styles.timeText}>{formatTime(eventData.endTime)}</Text>
          <Ionicons name="time-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Repeat:</Text>
        {renderRepeatDropdown()}
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Alarm:</Text>
        {renderAlarmDropdown()}
      </View>
    </View>
  );
};

export default function EventFormScreen({ startDate, endDate, onSave, events, event, isEditing, onSelectDatesForEventIndex }) {
  // State for the current event being edited
  const initialEventForm = {
    title: event?.title || '',
    selectedStartDate: startDate || event?.date || '',
    selectedEndDate: endDate || event?.date || '', // Initialize end date as well
    startTime: event?.startTime ? parseTimeString(event.startTime) : new Date(),
    endTime: event?.endTime ? parseTimeString(event.endTime) : new Date(new Date().setHours(new Date().getHours() + 1)),
    repeat: event?.repeat || RepeatOptions.NONE,
    alarm: event?.alarm || AlarmOptions.NONE,
  };
  
  // State for managing multiple event forms
  const [eventForms, setEventForms] = useState([initialEventForm]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentField, setCurrentField] = useState(null); // 'start' or 'end'
  
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

  // Parse time strings like "14:30" into Date objects
  function parseTimeString(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
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

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleStartDateChange = (event, selectedDate) => {
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
  };

  const handleEndDateChange = (event, selectedDate) => {
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
    
    const updatedForms = [...eventForms];
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
    setEventForms(updatedForms);
    setShowCalendarModal(false);
  };

  const handleStartTimeChange = (event, selectedTime) => {
    if (selectedTime) {
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
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const currentForm = eventForms[currentIndex];
      if (selectedTime <= currentForm.startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      
      const updatedForms = [...eventForms];
      updatedForms[currentIndex] = {
        ...currentForm,
        endTime: selectedTime
      };
      setEventForms(updatedForms);
    }
  };

  const handleUpdateEvent = (index, updatedData) => {
    const updatedForms = [...eventForms];
    updatedForms[index] = updatedData;
    setEventForms(updatedForms);
  };

  const handleRemoveEvent = (index) => {
    const updatedForms = [...eventForms];
    updatedForms.splice(index, 1);
    setEventForms(updatedForms);
  };

  const handleAddEvent = () => {
    // Clone the last event form as a template for the new one
    const lastForm = eventForms[eventForms.length - 1];
    
    // Create a proper new form with Date objects for time fields
    const newForm = {
      title: '', // Clear the title for the new event
      selectedStartDate: lastForm.selectedStartDate,
      selectedEndDate: lastForm.selectedEndDate,
      startTime: new Date(), // Create a new Date object for start time
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)), // Create a new Date object for end time
      repeat: lastForm.repeat,
      alarm: lastForm.alarm,
    };
    
    const newIndex = eventForms.length;
    setEventForms([...eventForms, newForm]);
    
    // Request to scroll to calendar for the new event
    if (onSelectDatesForEventIndex) {
      setTimeout(() => {
        onSelectDatesForEventIndex(newIndex);
      }, 100);
    }
  };

  const handleRequestDateSelection = (index, field) => {
    setCurrentIndex(index);
    setCurrentField(field);
    
    if (onSelectDatesForEventIndex) {
      onSelectDatesForEventIndex(index);
    } else {
      // When in Edit mode, show calendar in modal
      setShowCalendarModal(true);
    }
  };

  const handleSave = () => {
    if (!isFormValid) return;

    // Save each event
    for (const form of eventForms) {
      const eventData = {
        title: form.title.trim(),
        startTime: formatTime(form.startTime),
        endTime: formatTime(form.endTime),
        repeat: form.repeat,
        alarm: form.alarm,
      };

      if (isEditing && event?.id) {
        eventData.id = event.id;
      }

      // Check for time conflicts but don't block event creation
      if (hasTimeConflict(events, eventData, form.selectedStartDate, isEditing ? event?.id : null)) {
        // Show warning about conflict but allow creation
        Alert.alert(
          'Time Conflict Warning', 
          `This event overlaps with an existing event. Create it anyway?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Create Anyway',
              onPress: () => {
                // Save the event despite conflict
                onSave(form.selectedStartDate, form.selectedEndDate || form.selectedStartDate, eventData);
                
                // Reset form if not editing
                if (!isEditing) {
                  setEventForms([initialEventForm]);
                }
                
                // Close any open pickers/modals
                setShowStartTimeModal(false);
                setShowEndTimeModal(false);
                setShowRepeatPicker(false);
                setShowAlarmPicker(false);
                setShowCalendarModal(false);
              }
            }
          ]
        );
        return;
      }

      onSave(form.selectedStartDate, form.selectedEndDate || form.selectedStartDate, eventData);
    }
    
    // Reset form if not editing
    if (!isEditing) {
      setEventForms([initialEventForm]);
    }

    // Close any open pickers/modals
    setShowStartTimeModal(false);
    setShowEndTimeModal(false);
    setShowRepeatPicker(false);
    setShowAlarmPicker(false);
    setShowCalendarModal(false);
  };

  const renderTimePicker = (time, onChange, onConfirm) => (
    <View style={styles.timePickerContainer}>
      <DateTimePicker
        value={time}
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={onChange}
        style={styles.timePicker}
      />
      <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {eventForms.map((form, index) => (
          <EventForm
            key={index}
            index={index}
            eventData={form}
            onUpdate={handleUpdateEvent}
            onRemove={handleRemoveEvent}
            showStartDatePicker={showStartDatePicker}
            showEndDatePicker={showEndDatePicker}
            showStartTimeModal={showStartTimeModal}
            showEndTimeModal={showEndTimeModal}
            showRepeatPicker={showRepeatPicker}
            showAlarmPicker={showAlarmPicker}
            setShowStartDatePicker={setShowStartDatePicker}
            setShowEndDatePicker={setShowEndDatePicker}
            setShowStartTimeModal={setShowStartTimeModal}
            setShowEndTimeModal={setShowEndTimeModal}
            setShowRepeatPicker={setShowRepeatPicker}
            setShowAlarmPicker={setShowAlarmPicker}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onRequestDateSelection={handleRequestDateSelection}
            isEditing={isEditing}
          />
        ))}

        {!isEditing && (
          <TouchableOpacity
            style={styles.createNewEventContainer}
            onPress={handleAddEvent}
          >
            <AntDesign name="pluscircle" size={20} color="#2196F3" />
            <Text style={styles.createNewEventText}>Create New Event</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.createButton, !isFormValid && styles.createButtonDisabled]}
          onPress={handleSave}
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
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={new Date(eventForms[currentIndex].selectedEndDate || eventForms[currentIndex].selectedStartDate || new Date())}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
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
                handleStartTimeChange,
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
                handleEndTimeChange,
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
                onDateChange={handleCalendarDayPress}
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
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  eventFormContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  removeEventButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffeeee',
    justifyContent: 'center',
    alignItems: 'center',
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
  inlineLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  dateTimeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    padding: 0,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timePickerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
    height: 200,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  createNewEventText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createNewEventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2196F3',
    borderRadius: 8,
  },
  webSelectContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
}); 