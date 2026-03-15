import React from 'react';
import { NavigationContainer, DefaultTheme, StackActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import ClosetScreen from '../screens/ClosetScreen';
import OutfitBuilderScreen from '../screens/OutfitBuilderScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import OutfitDetailsScreen from '../screens/OutfitDetailsScreen';
import SocialLogScreen from '../screens/SocialLogScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClosetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClosetList" component={ClosetScreen} />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen} 
        options={{ headerBackTitle: 'Closet' }} 
      />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen} 
        options={({ route }: any) => ({
          headerShown: true, 
          title: route.params?.editItem ? 'Edit Item' : 'Add Item',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerBackTitle: 'Closet',
        })}
      />
    </Stack.Navigator>
  );
}

function ArchiveStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ArchiveList" component={ArchiveScreen} />
      <Stack.Screen name="OutfitDetails" component={OutfitDetailsScreen} />
    </Stack.Navigator>
  );
}

function SocialLogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialLogList" component={SocialLogScreen} />
      <Stack.Screen name="OutfitDetails" component={OutfitDetailsScreen} />
    </Stack.Navigator>
  );
}

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
          unmountOnBlur: true,
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

            if (route.name === 'OutfitBuilderTab') {
              return (
                <View style={[styles.iconWrap, focused && { backgroundColor: Colors.accentSoft }]}>
                  <Ionicons name={iconName} size={22} color={focused ? Colors.accent : Colors.textMuted} />
                </View>
              );
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
        <Tab.Screen 
          name="DashboardTab" 
          component={DashboardScreen} 
          options={{ tabBarLabel: 'Home' }} 
        />
        <Tab.Screen 
          name="ClosetTab" 
          component={ClosetStack} 
          options={{ tabBarLabel: 'Closet' }} 
          listeners={({ navigation }) => ({
            blur: () => {
              const state = navigation.getState();
              const route = state.routes.find((r: any) => r.name === 'ClosetTab');
              if (route && route.state && typeof route.state.index === 'number' && route.state.index > 0) {
                navigation.dispatch(StackActions.popToTop());
              }
            },
          })}
        />
        <Tab.Screen 
          name="OutfitBuilderTab" 
          component={OutfitBuilderScreen} 
          options={{ tabBarLabel: 'Create' }} 
        />
        <Tab.Screen 
          name="ArchiveTab" 
          component={ArchiveStack} 
          options={{ tabBarLabel: 'Saved' }} 
          listeners={({ navigation }) => ({
            blur: () => {
              const state = navigation.getState();
              const route = state.routes.find((r: any) => r.name === 'ArchiveTab');
              if (route && route.state && typeof route.state.index === 'number' && route.state.index > 0) {
                navigation.dispatch(StackActions.popToTop());
              }
            },
          })}
        />
        <Tab.Screen 
          name="SocialLogTab" 
          component={SocialLogStack} 
          options={{ tabBarLabel: 'History' }} 
          listeners={({ navigation }) => ({
            blur: () => {
              const state = navigation.getState();
              const route = state.routes.find((r: any) => r.name === 'SocialLogTab');
              if (route && route.state && typeof route.state.index === 'number' && route.state.index > 0) {
                navigation.dispatch(StackActions.popToTop());
              }
            },
          })}
        />
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
