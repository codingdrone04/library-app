// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import { STORAGE_KEYS } from '../constants';

class AuthService {
  // Login avec vraie API
  async login(username, password) {
    try {
      const response = await apiService.api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        await this.storeUserData(response.data.data.user, response.data.data.token);
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Erreur de connexion');
    }
  }

  // Register avec vraie API
  async register(userData) {
    try {
      const response = await apiService.api.post('/auth/register', userData);

      if (response.data.success) {
        await this.storeUserData(response.data.data.user, response.data.data.token);
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  }

  // Store user data
  async storeUserData(user, token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      
      // Configurer le token pour les futures requêtes API
      apiService.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Store user data error:', error);
      throw new Error('Erreur de stockage des données utilisateur');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      
      if (userData && token) {
        // Configurer le token pour les requêtes API
        apiService.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return {
          user: JSON.parse(userData),
          token: token,
          isAuthenticated: true,
        };
      }
      
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      // Supprimer le token des headers API
      delete apiService.api.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }
}

export default new AuthService();