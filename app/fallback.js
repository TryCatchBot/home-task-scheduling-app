import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function FallbackScreen() {
  const router = useRouter();
  
  const handleHomePress = () => {
    try {
      router.replace('/');
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };
  
  const handleSchedulesPress = () => {
    try {
      router.replace('/schedules');
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>HomeTask</Text>
        <Text style={styles.subtitle}>Choose a screen to navigate to:</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleHomePress}>
            <AntDesign name="calendar" size={24} color="#333" />
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleSchedulesPress}>
            <Feather name="list" size={24} color="#333" />
            <Text style={styles.buttonText}>All Events</Text>
          </TouchableOpacity>
        </View>
        
        {Platform.OS === 'android' && (
          <Text style={styles.note}>
            If you continue to experience issues, try restarting the app with a cleared cache.
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fada5e',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#555',
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#fada5e',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: 140,
  },
  buttonText: {
    marginTop: 8,
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    marginTop: 40,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 