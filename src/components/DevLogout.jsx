import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../constants';

const DevLogout = () => {
  const { logout, isAuthenticated, user } = useAuth();

  if (!__DEV__ || !isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      console.log('🔓 Déconnexion forcée (mode dev)');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.info}>
        Mode Dev - Connecté: {user?.username} ({user?.role})
      </Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>🔓 Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 10 : 50,
    right: 10,
    backgroundColor: COLORS.warning + '90',
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
    zIndex: 1000,
  },
  info: {
    color: COLORS.textPrimary,
    fontSize: 10,
    marginBottom: SPACING.xs,
  },
  button: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DevLogout;