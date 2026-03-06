import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import ClosetScreen from '../screens/ClosetScreen';
import OutfitBuilderScreen from '../screens/OutfitBuilderScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import SocialLogScreen from '../screens/SocialLogScreen';

const Tab = createBottomTabNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.accent,
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={LightTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            switch (route.name) {
              case 'DashboardTab':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'ClosetTab':
                iconName = focused ? 'shirt' : 'shirt-outline';
                break;
              case 'OutfitBuilderTab':
                iconName = focused ? 'add-circle' : 'add-circle-outline';
                break;
              case 'ArchiveTab':
                iconName = focused ? 'bookmark' : 'bookmark-outline';
                break;
              case 'SocialLogTab':
                iconName = focused ? 'time' : 'time-outline';
                break;
            }

            return (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons name={iconName} size={22} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: Colors.text,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.borderLight,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            height: Platform.OS === 'ios' ? 88 : 68,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500' as const,
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="ClosetTab" component={ClosetScreen} options={{ tabBarLabel: 'Closet' }} />
        <Tab.Screen name="OutfitBuilderTab" component={OutfitBuilderScreen} options={{ tabBarLabel: 'Create' }} />
        <Tab.Screen name="ArchiveTab" component={ArchiveScreen} options={{ tabBarLabel: 'Saved' }} />
        <Tab.Screen name="SocialLogTab" component={SocialLogScreen} options={{ tabBarLabel: 'History' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(26,26,46,0.08)',
  },
});
