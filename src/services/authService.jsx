import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import { STORAGE_KEYS } from '../constants';

class AuthService {
  // Login avec vraie API
  async login(username, password) {
    try {
      console.log('🔐 Tentative de connexion:', username);
      
      const response = await apiService.api.post('/auth/login', {
        username,
        password
      });

      console.log('✅ Réponse login:', response.data);

      if (response.data.success) {
        await this.storeUserData(response.data.data.user, response.data.data.token);
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error('Erreur de connexion au serveur');
    }
  }

  // Register avec vraie API
  async register(userData) {
    try {
      console.log('📝 Tentative d\'inscription:', userData.username);
      
      const response = await apiService.api.post('/auth/register', {
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
        age: userData.age
      });

      console.log('✅ Réponse register:', response.data);

      if (response.data.success) {
        await this.storeUserData(response.data.data.user, response.data.data.token);
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Erreur register:', error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error('Erreur lors de l\'inscription');
    }
  }

  // Vérifier le token avec l'API
  async verifyToken(token) {
    try {
      const response = await apiService.api.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Token invalide:', error);
      return null;
    }
  }

  // Store user data
  async storeUserData(user, token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      
      // Configurer le token pour les futures requêtes API
      apiService.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('💾 Données utilisateur sauvegardées');
    } catch (error) {
      console.error('❌ Erreur stockage:', error);
      throw new Error('Erreur de stockage des données utilisateur');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      
      if (userData && token) {
        // Vérifier que le token est toujours valide
        const verifiedData = await this.verifyToken(token);
        
        if (verifiedData) {
          // Configurer le token pour les requêtes API
          apiService.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return {
            user: verifiedData.user,
            token: verifiedData.token,
            isAuthenticated: true,
          };
        } else {
          // Token invalide, nettoyer le stockage
          await this.clearStoredData();
        }
      }
      
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }
  }

  // Clear stored data
  async clearStoredData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      // Supprimer le token des headers API
      delete apiService.api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('❌ Erreur clearStoredData:', error);
    }
  }

  // Logout
  async logout() {
    try {
      await this.clearStoredData();
      console.log('👋 Déconnexion réussie');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur logout:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  // Méthodes utilitaires
  isLibrarian(user) {
    return user?.role === 'librarian' || user?.role === 'admin';
  }

  isAdmin(user) {
    return user?.role === 'admin';
  }
}

export default new AuthService();