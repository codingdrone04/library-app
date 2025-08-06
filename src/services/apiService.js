import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG } from '../constants';

// Import du config local (à gitignorer)
let localConfig = null;
try {
  localConfig = require('../config/local').LOCAL_CONFIG;
} catch (error) {
  // Fichier local pas trouvé, on continue sans
  console.log('📍 Fichier config local non trouvé, utilisation auto-détection');
}

class ApiService {
  constructor() {
    // Configuration dynamique de l'URL
    this.baseURL = this.determineBaseURL();
    
    // Instance axios
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('🌐 API Base URL:', this.baseURL);
    
    // Intercepteurs pour logging et gestion d'erreurs
    this.setupInterceptors();
  }

  determineBaseURL() {
    if (__DEV__) {
      if (Platform.OS === 'android') {
        // 1. Utiliser le config local si disponible
        if (localConfig?.API_HOST) {
          console.log('📍 Utilisation config local:', localConfig.API_HOST);
          return `http://${localConfig.API_HOST}:${localConfig.API_PORT || '3000'}/api`;
        }
        
        // 2. Essayer l'IP locale détectée automatiquement
        const { manifest } = Constants;
        if (manifest?.debuggerHost) {
          const localIP = manifest.debuggerHost.split(':')[0];
          console.log('📍 IP locale détectée:', localIP);
          return `http://${localIP}:3000/api`;
        }
        
        // 3. Fallback vers l'émulateur Android standard
        console.log('📍 Fallback vers IP émulateur Android: 10.0.2.2');
        return 'http://10.0.2.2:3000/api';
      } else if (Platform.OS === 'ios') {
        // Pour le simulateur iOS
        return `http://localhost:3000/api`;
      } else {
        // Pour le web ou autre
        return `http://localhost:3000/api`;
      }
    } else {
      // En production, utiliser l'URL de production
      return API_CONFIG.BASE_URL;
    }
  }

  getLocalIP() {
    // Récupère l'IP locale via Expo Constants
    const { manifest } = Constants;
    if (manifest?.debuggerHost) {
      const ip = manifest.debuggerHost.split(':')[0];
      return `http://${ip}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }

  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // TODO: Ajouter auth token quand on aura l'authentification
        // const token = await AsyncStorage.getItem('auth_token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        // Log plus détaillé pour débugger
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.error('❌ Connexion impossible au serveur:', this.baseURL);
          console.error('💡 Vérifiez que le serveur backend est démarré');
        } else {
          console.error('❌ API Error:', error.response?.data || error.message);
        }
        
        // Gestion des erreurs communes
        if (error.response?.status === 401) {
          console.log('🔐 Auth required - redirect to login');
        }
        
        return Promise.reject(this.formatError(error));
      }
    );
  }

  formatError(error) {
    if (error.response) {
      // Erreur du serveur (4xx, 5xx)
      return {
        message: error.response.data?.error || error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Pas de réponse (problème réseau)
      return {
        message: `Impossible de se connecter au serveur (${this.baseURL}). Vérifiez que le backend est démarré.`,
        status: 0,
        network: true,
        baseURL: this.baseURL
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Une erreur est survenue',
        status: -1
      };
    }
  }

  // ===== TEST DE CONNEXION =====
  async testConnection() {
    try {
      console.log('🔍 Test de connexion à:', this.baseURL);
      const response = await this.api.get('/books/stats');
      
      return {
        success: true,
        message: 'Connexion API réussie',
        stats: response.data.data,
        baseURL: this.baseURL
      };
    } catch (error) {
      return {
        success: false,
        message: `Impossible de se connecter à l'API (${this.baseURL})`,
        error: error.message,
        baseURL: this.baseURL
      };
    }
  }


  async getBooks(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        author,
        search,
        sortBy = 'title',
        sortOrder = 'asc'
      } = options;

      const params = {
        page,
        limit,
        sortBy,
        sortOrder
      };

      if (status) params.status = status;
      if (category) params.category = category;
      if (author) params.author = author;
      if (search) params.search = search;

      const response = await this.api.get('/books', { params });
      
      return {
        success: true,
        books: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  async getPopularBooks(limit = 10) {
    try {
      const response = await this.api.get('/books/popular', {
        params: { limit }
      });
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getRecentBooks(limit = 10) {
    try {
      const response = await this.api.get('/books/recent', {
        params: { limit }
      });
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async searchBooks(query, options = {}) {
    try {
      const params = {
        search: query,
        ...options
      };

      const response = await this.api.get('/books', { params });
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getSearchSuggestions(query) {
    try {
      const response = await this.api.get('/books/search/suggestions', {
        params: { q: query }
      });
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getBookById(id) {
    try {
      const response = await this.api.get(`/books/${id}`);
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async addBook(bookData) {
    try {
      const response = await this.api.post('/books', bookData);
      
      return {
        success: true,
        book: response.data.data,
        enriched: response.data.enriched
      };
    } catch (error) {
      throw error;
    }
  }

  async updateBook(id, bookData) {
    try {
      const response = await this.api.put(`/books/${id}`, bookData);
      
      return {
        success: true,
        book: response.data.data
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteBook(id) {
    try {
      const response = await this.api.delete(`/books/${id}`);
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw error;
    }
  }

  async enrichBook(id) {
    try {
      const response = await this.api.post(`/books/${id}/enrich`);
      
      return {
        success: response.data.success,
        book: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      throw error;
    }
  }

  async getLibraryStats() {
    try {
      const response = await this.api.get('/books/stats');
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTHODES EMPRUNTS (TODO) =====

  async borrowBook(bookId, userId) {
    try {
      const response = await this.api.post('/loans', {
        bookId,
        userId
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async returnBook(bookId, userId) {
    try {
      const response = await this.api.patch(`/loans/${bookId}/return`, {
        userId
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserBorrowedBooks(userId) {
    try {
      const response = await this.api.get(`/loans/user/${userId}`);
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTHODES UTILISATEURS (TODO) =====

  async login(username, password) {
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== UTILITAIRES =====
  
  getBaseURL() {
    return this.baseURL;
  }

  isDevelopment() {
    return __DEV__;
  }
}

export default new ApiService();