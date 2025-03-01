import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_STORAGE_KEY = '@calendar_events';
const ALARMS_STORAGE_KEY = '@calendar_alarms';

export const RepeatOptions = {
  NONE: 'none',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
};

export const AlarmOptions = {
  NONE: 'none',
  AT_TIME: 'at_time',
  FIVE_MIN: '5min',
  FIFTEEN_MIN: '15min',
  THIRTY_MIN: '30min',
  ONE_HOUR: '1hour',
  ONE_DAY: '1day',
};

// Save events to local storage
export const saveEvents = async (events) => {
  try {
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

// Load events from local storage
export const loadEvents = async () => {
  try {
    const eventsJson = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    return eventsJson ? JSON.parse(eventsJson) : {};
  } catch (error) {
    console.error('Error loading events:', error);
    return {};
  }
};

// Save alarms to local storage
export const saveAlarms = async (alarms) => {
  try {
    await AsyncStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.error('Error saving alarms:', error);
  }
};

// Load alarms from local storage
export const loadAlarms = async () => {
  try {
    const alarmsJson = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
    return alarmsJson ? JSON.parse(alarmsJson) : {};
  } catch (error) {
    console.error('Error loading alarms:', error);
    return {};
  }
};

// Get alarm time based on event and alarm setting
export const getAlarmTime = (eventDate, eventTime, alarmSetting) => {
  if (alarmSetting === AlarmOptions.NONE) {
    return null;
  }
  
  // Parse event date and time
  const [hours, minutes] = eventTime.split(':').map(Number);
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours, minutes, 0, 0);
  
  // Calculate alarm time based on setting
  const alarmTime = new Date(eventDateTime);
  
  switch (alarmSetting) {
    case AlarmOptions.AT_TIME:
      // Alarm exactly at event time
      break;
    case AlarmOptions.FIVE_MIN:
      alarmTime.setMinutes(alarmTime.getMinutes() - 5);
      break;
    case AlarmOptions.FIFTEEN_MIN:
      alarmTime.setMinutes(alarmTime.getMinutes() - 15);
      break;
    case AlarmOptions.THIRTY_MIN:
      alarmTime.setMinutes(alarmTime.getMinutes() - 30);
      break;
    case AlarmOptions.ONE_HOUR:
      alarmTime.setHours(alarmTime.getHours() - 1);
      break;
    case AlarmOptions.ONE_DAY:
      alarmTime.setDate(alarmTime.getDate() - 1);
      break;
    default:
      return null;
  }
  
  return alarmTime;
};

// Format alarm setting for display
export const formatAlarmSetting = (alarmSetting) => {
  switch (alarmSetting) {
    case AlarmOptions.NONE:
      return 'No Alarm';
    case AlarmOptions.AT_TIME:
      return 'At time of event';
    case AlarmOptions.FIVE_MIN:
      return '5 minutes before';
    case AlarmOptions.FIFTEEN_MIN:
      return '15 minutes before';
    case AlarmOptions.THIRTY_MIN:
      return '30 minutes before';
    case AlarmOptions.ONE_HOUR:
      return '1 hour before';
    case AlarmOptions.ONE_DAY:
      return '1 day before';
    default:
      return 'No Alarm';
  }
};

// Check if a date is in the past
export const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

// Check for time slot conflicts
export const hasTimeConflict = (events, newEvent, date, excludeEventId = null) => {
  const dateEvents = events[date] || [];
  const newStart = new Date(`${date}T${newEvent.startTime || newEvent.time}`);
  const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // Assuming 1-hour events

  return dateEvents.some(event => {
    // Skip the event we're editing (if provided)
    if (excludeEventId && event.id === excludeEventId) return false;
    
    const eventTime = event.startTime || event.time; // Handle different naming
    const eventStart = new Date(`${date}T${eventTime}`);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);

    return (newStart < eventEnd && newEnd > eventStart);
  });
};

// Generate recurring dates for an event
export const generateRecurringDates = (startDate, repeatOption, months = 12) => {
  const dates = [startDate];
  const start = new Date(startDate);
  
  for (let i = 1; i < months * 31; i++) {
    let nextDate = new Date(start);
    
    switch (repeatOption) {
      case RepeatOptions.WEEKLY:
        nextDate.setDate(start.getDate() + (i * 7));
        break;
      case RepeatOptions.BIWEEKLY:
        nextDate.setDate(start.getDate() + (i * 14));
        break;
      case RepeatOptions.MONTHLY:
        nextDate.setMonth(start.getMonth() + i);
        break;
      default:
        continue;
    }
    
    if (nextDate.getTime() - start.getTime() > months * 30 * 24 * 60 * 60 * 1000) {
      break;
    }
    
    dates.push(nextDate.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Format date in the format "fri feb 28 2026"
export const formatDateToFriendly = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  const dayOfWeek = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  
  return `${dayOfWeek} ${month} ${dayOfMonth} ${year}`;
}; 