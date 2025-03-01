import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

// We're using expo-router now, so this file redirects to the expo-router entry point
export default function App() {
  return <Redirect href="/" />;
}
