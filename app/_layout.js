import React, { useEffect, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, Feather } from '@expo/vector-icons';
import { requestNotificationPermissions, setupNotificationListener } from '../src/utils/alarmService';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';

// Ignore specific warnings that could be affecting Android
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'componentWillReceiveProps has been renamed',
  'componentWillMount has been renamed'
]);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Only use expo-router for all app routing
export default function AppLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize any important libraries or settings
        const setupNotifications = async () => {
          try {
            const permissionsGranted = await requestNotificationPermissions();
            console.log('Notification permissions granted:', permissionsGranted);
          } catch (e) {
            console.warn('Notification setup failed:', e);
            // Continue anyway - non-critical feature
          }
        };
        
        await setupNotifications();
        
        // Artificial delay to ensure all rendering is complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the splash screen after all layout calculations are complete
      await SplashScreen.hideAsync().catch(console.warn);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Use platform-specific styling, but the same Tab navigator
  const containerStyles = Platform.OS === 'web' 
    ? styles.webContainer 
    : styles.container;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <View style={containerStyles}>
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: '#f9f9f9' },
            headerTintColor: '#333',
            tabBarActiveTintColor: '#fada5e',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: { 
              backgroundColor: '#f9f9f9',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <AntDesign name="calendar" size={24} color={color} />
              ),
              headerTitle: "Schedule",
            }}
          />
          <Tabs.Screen
            name="schedules"
            options={{
              title: "My Schedules",
              tabBarIcon: ({ color }) => (
                <Feather name="list" size={24} color={color} />
              ),
              headerTitle: "All Events",
              headerShown: true,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    maxWidth: 800, // Limit width on web
    width: '100%',
    alignSelf: 'center', // Center the app on web
    height: '100vh', // Use viewport height on web
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
  },
}); 