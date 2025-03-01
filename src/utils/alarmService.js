import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAlarmTime } from './eventUtils';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions for notifications
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('event-alarms', {
      name: 'HomeTask Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Schedule an alarm notification for an event
export const scheduleAlarmForEvent = async (event) => {
  if (!event.alarm || event.alarm === 'none') {
    return null;
  }

  try {
    // Get the alarm time based on event settings
    const alarmTime = getAlarmTime(event.date, event.startTime, event.alarm);
    
    if (!alarmTime) {
      return null;
    }

    // Skip if the alarm time is in the past
    if (alarmTime < new Date()) {
      return null;
    }
    
    // Calculate trigger time in seconds
    const trigger = alarmTime.getTime() - new Date().getTime();
    
    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `HomeTask: ${event.title}`,
        body: `Event starts at ${event.startTime}`,
        sound: true,
        data: { eventId: event.id }
      },
      trigger: { seconds: Math.floor(trigger / 1000) }
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Cancel an existing alarm notification
export const cancelAlarmForEvent = async (notificationId) => {
  if (!notificationId) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Set up a listener for notification actions (e.g., when user taps notification)
export const setupNotificationListener = (navigation) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { eventId } = response.notification.request.content.data;
    
    // Navigate to the event details when notification is tapped
    if (eventId && navigation) {
      // We need to find the event first by ID
      // This would require loading the events and finding the one with the matching ID
      // For now, we'll just navigate to the calendar
      navigation.navigate('Calendar');
    }
  });
  
  return subscription;
}; 