// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import BorrowedBooksScreen from '../screens/BorrowedBooksScreen';
import ProfileScreen from '../screens/ProfileScreen';
// TODO: Créer ces écrans
// import ScanScreen from '../screens/ScanScreen';

// Context
import { useAuth } from '../context/AuthContext';
import { COLORS, ROUTES } from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ color: COLORS.textPrimary, marginTop: 16 }}>Chargement...</Text>
  </View>
);

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator
    initialRouteName={ROUTES.LOGIN}
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
    }}
  >
    <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
    <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => {
  const { isLibrarian } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.surface,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 15,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 5,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === ROUTES.BOOK_LIST) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.BORROWED_BOOKS) {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === ROUTES.SCAN) {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name={ROUTES.BOOK_LIST} 
        component={BookListScreen}
      />
      <Tab.Screen 
        name={ROUTES.BORROWED_BOOKS} 
        component={BorrowedBooksScreen}
      />
      {/* Scan seulement pour les bibliothécaires */}
      {isLibrarian() && (
        <Tab.Screen 
          name={ROUTES.SCAN} 
          component={() => <PlaceholderScreen title="Scan" />}
        />
      )}
      <Tab.Screen 
        name={ROUTES.PROFILE} 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

// Main App Stack (avec navigation vers détails)
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    <Stack.Screen name={ROUTES.BOOK_DETAIL} component={BookDetailScreen} />
  </Stack.Navigator>
);

// Placeholder component pour les écrans pas encore créés
const PlaceholderScreen = ({ title }) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background 
  }}>
    <Ionicons name="construct-outline" size={80} color={COLORS.primary} />
    <Text style={{ 
      color: COLORS.textPrimary, 
      fontSize: 24, 
      fontWeight: 'bold', 
      marginTop: 16 
    }}>
      {title}
    </Text>
    <Text style={{ 
      color: COLORS.textSecondary, 
      fontSize: 16, 
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
    }}>
      Cet écran sera disponible prochainement
    </Text>
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default AppNavigator;