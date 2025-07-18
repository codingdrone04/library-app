import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../constants';

const BottomNavigation = ({ activeTab = 'home' }) => {
  const navigation = useNavigation();

  const navigateToHome = () => {
    navigation.navigate(ROUTES.BOOK_LIST);
  };

  const navigateToLibrary = () => {
    navigation.navigate(ROUTES.BORROWED_BOOKS);
  };

  const navigateToScan = () => {
    console.log('Navigate to Scan');
  };

  const navigateToProfile = () => {
    navigation.navigate(ROUTES.PROFILE);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={navigateToHome}
      >
        <Ionicons 
          name={activeTab === 'home' ? 'home' : 'home-outline'} 
          size={28} 
          color={activeTab === 'home' ? '#FF6B35' : '#666'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={navigateToLibrary}
      >
        <Ionicons 
          name={activeTab === 'library' ? 'library' : 'library-outline'} 
          size={28} 
          color={activeTab === 'library' ? '#FF6B35' : '#666'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={navigateToScan}
      >
        <Ionicons 
          name={activeTab === 'scan' ? 'scan' : 'scan-outline'} 
          size={28} 
          color={activeTab === 'scan' ? '#FF6B35' : '#666'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={navigateToProfile}
      >
        <Ionicons 
          name={activeTab === 'profile' ? 'person' : 'person-outline'} 
          size={28} 
          color={activeTab === 'profile' ? '#FF6B35' : '#666'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#B0BEC5',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#90A4AE',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default BottomNavigation;