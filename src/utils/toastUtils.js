import { Platform, ToastAndroid, Alert } from 'react-native';

/**
 * Show a toast message that works on both iOS and Android
 * @param {string} message - Message to display in toast
 * @param {string} duration - 'short' or 'long' (Android only)
 */
export const showToast = (message, duration = 'short') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, duration === 'short' ? ToastAndroid.SHORT : ToastAndroid.LONG);
  } else {
    // On iOS, use Alert without buttons as a simple toast alternative
    Alert.alert(
      '',
      message,
      [{ text: 'OK', onPress: () => {} }],
      { cancelable: true }
    );
  }
}; 