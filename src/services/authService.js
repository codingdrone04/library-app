import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS, USER_ROLES } from '../constants';

class AuthService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Login user
  async login(username, password) {
    try {
      // TODO: Remplacer par un vrai appel API
      const response = await this.mockLogin(username, password);
      
      if (response.success) {
        await this.storeUserData(response.user, response.token);
        return {
          success: true,
          user: response.user,
          token: response.token,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Erreur de connexion');
    }
  }

  // Register user
  async register(userData) {
    try {
      // TODO: Remplacer par un vrai appel API
      const response = await this.mockRegister(userData);
      
      if (response.success) {
        await this.storeUserData(response.user, response.token);
        return {
          success: true,
          user: response.user,
          token: response.token,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  }

  // Logout user
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      
      if (userData && token) {
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

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      return !!token;
    } catch (error) {
      console.error('Is authenticated error:', error);
      return false;
    }
  }

  // Store user data in AsyncStorage
  async storeUserData(user, token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Store user data error:', error);
      throw new Error('Erreur de stockage des données utilisateur');
    }
  }

  // Validate user data
  validateUserData(userData) {
    const errors = {};

    if (!userData.firstname?.trim()) {
      errors.firstname = 'Le prénom est requis';
    }

    if (!userData.lastname?.trim()) {
      errors.lastname = 'Le nom est requis';
    }

    if (!userData.username?.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    } else if (userData.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!userData.email?.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!userData.password?.trim()) {
      errors.password = 'Le mot de passe est requis';
    } else if (userData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (userData.age && (userData.age < 13 || userData.age > 120)) {
      errors.age = 'L\'âge doit être entre 13 et 120 ans';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Mock functions (à remplacer par de vrais appels API)
  async mockLogin(username, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          resolve({
            success: true,
            user: {
              id: 1,
              firstname: 'Admin',
              lastname: 'User',
              username: 'admin',
              email: 'admin@library.com',
              role: USER_ROLES.LIBRARIAN,
              age: 30,
              preferred_genres: ['Fiction', 'Science'],
              notifications_enabled: true,
              registration_date: new Date().toISOString(),
            },
            token: 'mock-jwt-token-admin',
          });
        } else if (username === 'user' && password === 'user') {
          resolve({
            success: true,
            user: {
              id: 2,
              firstname: 'Test',
              lastname: 'User',
              username: 'user',
              email: 'user@library.com',
              role: USER_ROLES.USER,
              age: 25,
              preferred_genres: ['Fiction', 'Romance'],
              notifications_enabled: true,
              registration_date: new Date().toISOString(),
            },
            token: 'mock-jwt-token-user',
          });
        } else {
          resolve({
            success: false,
            message: 'Nom d\'utilisateur ou mot de passe incorrect',
          });
        }
      }, 1500);
    });
  }

  async mockRegister(userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validation
        const validation = this.validateUserData(userData);
        if (!validation.isValid) {
          resolve({
            success: false,
            message: Object.values(validation.errors)[0],
          });
          return;
        }

        // Simulate successful registration
        resolve({
          success: true,
          user: {
            id: Date.now(), // Mock ID
            firstname: userData.firstname,
            lastname: userData.lastname,
            username: userData.username,
            email: userData.email,
            role: userData.role || USER_ROLES.USER,
            age: userData.age || null,
            preferred_genres: userData.preferred_genres || [],
            notifications_enabled: true,
            registration_date: new Date().toISOString(),
          },
          token: `mock-jwt-token-${Date.now()}`,
        });
      }, 1500);
    });
  }
}

export default new AuthService();