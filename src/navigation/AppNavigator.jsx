import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import ScanScreen from '../screens/ScanScreen';
import AdminScreen from '../screens/AdminScreen';
import AddBookScreen from '../screens/AddBookScreen';
import EditBookScreen from '../screens/EditBookScreen';

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

// Écran principal de gestion des livres pour bibliothécaires
const ManageBooksMainScreen = ({ navigation }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Ajouter un livre',
      description: 'Ajouter un nouveau livre à la bibliothèque',
      icon: 'add-circle',
      color: COLORS.success,
      onPress: () => navigation.navigate('AddBookScreen')
    },
    {
      title: 'Scanner un code-barres',
      description: 'Scanner pour ajouter rapidement (bientôt)',
      icon: 'scan',
      color: COLORS.info,
      onPress: () => navigation.navigate(ROUTES.SCAN)
    },
    {
      title: 'Gestion avancée',
      description: 'Statistiques et administration',
      icon: 'settings',
      color: COLORS.accent,
      onPress: () => navigation.navigate('AdminScreen')
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 48, 
        paddingBottom: 24 
      }}>
        <Text style={{ 
          fontSize: 28, 
          fontWeight: 'bold', 
          color: COLORS.textPrimary, 
          letterSpacing: 2, 
          textAlign: 'center' 
        }}>
          Gestion
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: COLORS.textSecondary, 
          textAlign: 'center', 
          marginTop: 8 
        }}>
          Bonjour {user?.firstname}, que souhaitez-vous faire ?
        </Text>
      </View>

      {/* Menu Items */}
      <View style={{ 
        flex: 1, 
        paddingHorizontal: 20 
      }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: COLORS.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={item.onPress}
          >
            <View style={{
              width: 50,
              height: 50,
              backgroundColor: item.color + '20',
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: COLORS.textPrimary,
                marginBottom: 4
              }}>
                {item.title}
              </Text>
              <Text style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 18
              }}>
                {item.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Statistiques rapides */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          padding: 20,
          marginTop: 16
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.textPrimary,
            marginBottom: 16
          }}>
            📊 Aperçu rapide
          </Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around'
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: COLORS.primary
              }}>
                📚
              </Text>
              <Text style={{
                fontSize: 12,
                color: COLORS.textMuted,
                textAlign: 'center'
              }}>
                Livres totaux
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: COLORS.success
              }}>
                ✅
              </Text>
              <Text style={{
                fontSize: 12,
                color: COLORS.textMuted,
                textAlign: 'center'
              }}>
                Disponibles
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: COLORS.warning
              }}>
                📖
              </Text>
              <Text style={{
                fontSize: 12,
                color: COLORS.textMuted,
                textAlign: 'center'
              }}>
                Empruntés
              </Text>
            </View>
          </View>
        </View>

        {/* Note d'information */}
        <View style={{
          backgroundColor: COLORS.info + '20',
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: COLORS.info
        }}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={{
            fontSize: 14,
            color: COLORS.textPrimary,
            marginLeft: 12,
            flex: 1,
            lineHeight: 18
          }}>
            💡 Vous pouvez enrichir automatiquement vos livres avec les données Google Books
          </Text>
        </View>
      </View>
    </View>
  );
};

// Stack pour la gestion des livres (bibliothécaires)
const ManageBooksStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ManageBooksMain" component={ManageBooksMainScreen} />
    <Stack.Screen name="AddBookScreen" component={AddBookScreen} />
    <Stack.Screen name="EditBookScreen" component={EditBookScreen} />
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
          } else if (route.name === 'ManageBooks') {
            iconName = focused ? 'create' : 'create-outline';
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
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen 
        name={ROUTES.BORROWED_BOOKS} 
        component={BorrowedBooksScreen}
        options={{ tabBarLabel: 'Mes livres' }}
      />
      
      {/* Onglets pour les bibliothécaires */}
      {isLibrarian() && (
        <>
          <Tab.Screen 
            name="ManageBooks" 
            component={ManageBooksStack}
            options={{ tabBarLabel: 'Gestion' }}
          />
        </>
      )}
      
      <Tab.Screen 
        name={ROUTES.PROFILE} 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// Stack principal de l'application
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
    <Stack.Screen name={ROUTES.SCAN} component={ScanScreen} />
    <Stack.Screen name="AdminScreen" component={AdminScreen} />
    <Stack.Screen name="AddBookScreen" component={AddBookScreen} />
    <Stack.Screen name="EditBookScreen" component={EditBookScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default AppNavigator;