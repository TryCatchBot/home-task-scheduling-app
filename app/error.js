import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export default function ErrorPage() {
  const router = useRouter();

  // Handle retrying navigation
  const handleRetry = () => {
    try {
      router.replace('/');
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <AntDesign name="exclamationcircleo" size={60} color="#fada5e" />
        
        <Text style={styles.title}>Navigation Error</Text>
        
        <Text style={styles.message}>
          There was a problem loading the requested screen.
        </Text>
        
        <Text style={styles.hint}>
          This could be due to a routing issue or missing dependencies.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        
        {Platform.OS === 'android' && (
          <Text style={styles.androidNote}>
            Note: On Android, you may need to restart the app or clear the cache.
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
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#777',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#fada5e',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  androidNote: {
    marginTop: 30,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 