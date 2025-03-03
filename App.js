import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

// This is a fallback for direct App.js access, but Expo Router entry will be used instead
export default function App() {
  return <Redirect href="/" />;
}
