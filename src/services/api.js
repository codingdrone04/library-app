import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let localConfig = null;
try {
  localConfig = require('../config/local').LOCAL_CONFIG;
} catch (error) {
  console.log('📍 Fichier config local non trouvé, utilisation auto-détection');
}

class ApiService {
  constructor() {
    this.baseURL = this.determineBaseURL();
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  determineBaseURL() {
    if (__DEV__) {
      if (Platform.OS === 'android') {
        if (localConfig?.API_HOST) {
          return `http://${localConfig.API_HOST}:${localConfig.API_PORT || '3000'}/api`;
        }
        
        const { manifest } = Constants;
        if (manifest?.debuggerHost) {
          const localIP = manifest.debuggerHost.split(':')[0];
          return `http://${localIP}:3000/api`;
        }
        
        return 'http://10.0.2.2:3000/api';
      } else {
        return `http://localhost:3000/api`;
      }
    } else {
      return 'https://your-production-api.com/api';
    }
  }

  setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.error('❌ Connexion impossible au serveur:', this.baseURL);
        } else {
          console.error('❌ API Error:', error.response?.data || error.message);
        }
        
        return Promise.reject(this.formatError(error));
      }
    );
  }

  formatError(error) {
    if (error.response) {
      return {
        message: error.response.data?.error || error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      return {
        message: `Impossible de se connecter au serveur (${this.baseURL}).`,
        status: 0,
        network: true,
        baseURL: this.baseURL
      };
    } else {
      return {
        message: error.message || 'Une erreur est survenue',
        status: -1
      };
    }
  }

  
  async getLibraryBooks(options = {}) {
    try {
      const response = await this.api.get('/books', { params: options });
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Impossible de charger les livres: ${error.message}`);
    }
  }

  async searchBooks(query, options = {}) {
    try {
      const params = { search: query, ...options };
      const response = await this.api.get('/books', { params });
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Recherche échouée: ${error.message}`);
    }
  }

  async getPopularBooks(limit = 10) {
    try {
      const response = await this.api.get('/books/popular', { params: { limit } });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getRecentBooks(limit = 10) {
    try {
      const response = await this.api.get('/books/recent', { params: { limit } });
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
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateBook(id, bookData) {
    try {
      const response = await this.api.put(`/books/${id}`, bookData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteBook(id) {
    try {
      const response = await this.api.delete(`/books/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLibraryStats() {
    try {
      const response = await this.api.get('/books/stats');
      return response.data.data;
    } catch (error) {
      return {};
    }
  }

  
  async borrowBook(bookId, userId) {
    try {
      const response = await this.api.post('/loans', { bookId, userId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async returnBook(bookId, userId) {
    try {
      const response = await this.api.patch(`/loans/${bookId}/return`, { userId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserBorrowedBooks(userId) {
    try {
      const response = await this.api.get(`/loans/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  
  async login(username, password) {
    try {
      const response = await this.api.post('/auth/login', { username, password });
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

  async verifyToken(token) {
    try {
      const response = await this.api.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  
  async testConnection() {
    try {
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

  getBaseURL() {
    return this.baseURL;
  }
}

export default new ApiService();