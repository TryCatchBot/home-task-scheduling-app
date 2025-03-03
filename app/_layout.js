import React, { useEffect, useState } from 'react';
import { Tabs, Slot, useRouter } from 'expo-router';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, Feather } from '@expo/vector-icons';
import { requestNotificationPermissions, setupNotificationListener } from '../src/utils/alarmService';
import { useWindowDimensions } from 'react-native';

// Web Navbar component with responsive design
const WebNavbar = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Use small screen layout if screen width is less than 768px
  const isSmallScreen = width < 768;
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const navigateTo = (path) => {
    router.push(path);
    if (menuOpen) setMenuOpen(false);
  };
  
  return (
    <View style={styles.navbarContainer}>
      <View style={styles.navbarContent}>
        <Text style={styles.navbarLogo}>HomeTask</Text>
        
        {isSmallScreen ? (
          // Hamburger menu for small screens
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            {menuOpen ? (
              <Feather name="x" size={24} color="#333" />
            ) : (
              <Feather name="menu" size={24} color="#333" />
            )}
          </TouchableOpacity>
        ) : (
          // Regular navigation links for larger screens
          <View style={styles.navLinks}>
            <TouchableOpacity 
              style={styles.navLink} 
              onPress={() => navigateTo('/')}
            >
              <AntDesign name="calendar" size={20} color="#333" />
              <Text style={styles.navLinkText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navLink} 
              onPress={() => navigateTo('/schedules')}
            >
              <Feather name="list" size={20} color="#333" />
              <Text style={styles.navLinkText}>My Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navLink} 
              onPress={() => navigateTo('/newEvent')}
            >
              <AntDesign name="plus" size={20} color="#333" />
              <Text style={styles.navLinkText}>New Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Dropdown menu for small screens */}
      {isSmallScreen && menuOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => navigateTo('/')}
          >
            <AntDesign name="calendar" size={20} color="#333" />
            <Text style={styles.dropdownItemText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => navigateTo('/schedules')}
          >
            <Feather name="list" size={20} color="#333" />
            <Text style={styles.dropdownItemText}>My Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => navigateTo('/newEvent')}
          >
            <AntDesign name="plus" size={20} color="#333" />
            <Text style={styles.dropdownItemText}>New Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Only use expo-router for all app routing
export default function AppLayout() {
  // Set up notifications
  useEffect(() => {
    const setupNotifications = async () => {
      const permissionsGranted = await requestNotificationPermissions();
      console.log('Notification permissions granted:', permissionsGranted);
    };
    
    setupNotifications();
    
    // Set up notification listener
    const subscription = setupNotificationListener();
    
    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" backgroundColor="#fada5e" />
      {Platform.OS === 'web' ? (
        // Web layout with custom navbar
        <View style={styles.webContainer}>
          <WebNavbar />
          <View style={styles.webContent}>
            <Slot />
          </View>
        </View>
      ) : (
        // Mobile layout with tab navigation - add safe area padding
        <View style={styles.mobileContainer}>
          <Tabs
            screenOptions={{
              headerShown: false, // We're using custom headers with SafeAreaView in each screen
              tabBarActiveTintColor: '#fada5e',
              tabBarInactiveTintColor: '#888',
              tabBarStyle: { 
                backgroundColor: '#f9f9f9',
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
                // Ensure tab bar doesn't interfere with camera or content
                height: Platform.OS === 'ios' ? 80 : 60,
                paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                position: 'absolute',
                bottom: 0,
                zIndex: 999, // Ensure it's below the floating button
              },
              tabBarItemStyle: {
                paddingVertical: 5,
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
              }}
            />
            <Tabs.Screen
              name="schedules"
              options={{
                title: "My Schedule",
                tabBarIcon: ({ color }) => (
                  <Feather name="list" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="newEvent"
              options={{
                href: null, // Don't show in tab bar
              }}
            />
            <Tabs.Screen
              name="editEvent"
              options={{
                href: null, // Don't show in tab bar
              }}
            />
          </Tabs>
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Web styles
  webContainer: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    height: '100vh',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
  },
  webContent: {
    flex: 1,
    overflow: 'auto',
  },
  // Navbar styles
  navbarContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    zIndex: 10,
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navbarLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fada5e',
  },
  navLinks: {
    flexDirection: 'row',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  navLinkText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  menuButton: {
    padding: 8,
  },
  dropdownMenu: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  mobileContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 0, // Add padding for camera notch
  },
}); 