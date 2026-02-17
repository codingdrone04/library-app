import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let localConfig = null;
try {
  localConfig = require('../config/local').LOCAL_CONFIG;
} catch (error) {
  console.log('📍 Local config file not found, using auto-detection');
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
    // If localConfig exists, use it for ALL environments (dev AND production builds)
    if (localConfig?.API_HOST) {
      const port = localConfig.API_PORT ? `:${localConfig.API_PORT}` : '';
      // If it's an external domain (contains a dot), no /api (handled by reverse proxy)
      // Otherwise (localhost, IP), add /api
      const apiSuffix = localConfig.API_HOST.includes('.') && !localConfig.API_HOST.match(/^\d/) ? '' : '/api';
      const protocol = localConfig.API_HOST.includes('.') && !localConfig.API_HOST.match(/^\d/) ? 'https' : 'http';
      return `${protocol}://${localConfig.API_HOST}${port}${apiSuffix}`;
    }

    if (__DEV__) {
      // Otherwise, auto-detect by platform (dev mode only)
      if (Platform.OS === 'android') {
        const { manifest } = Constants;
        if (manifest?.debuggerHost) {
          const localIP = manifest.debuggerHost.split(':')[0];
          return `http://${localIP}:3000/api`;
        }

        return 'http://10.0.2.2:3000/api';
      } else {
        // iOS / Web in dev: localhost by default
        return `http://localhost:3000/api`;
      }
    } else {
      // Production fallback - should not reach here if localConfig is set
      console.warn('⚠️ No API configuration found! Please create src/config/local.js');
      return 'https://your-production-api.com';
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
          console.error('❌ Unable to connect to server:', this.baseURL);
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
        message: error.response.data?.error || error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      return {
        message: `Unable to connect to the server (${this.baseURL}).`,
        status: 0,
        network: true,
        baseURL: this.baseURL
      };
    } else {
      return {
        message: error.message || 'An error occurred',
        status: -1
      };
    }
  }

  
  async getLibraryBooks(options = {}) {
    try {
      const response = await this.api.get('/books', { params: options });
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Unable to load books: ${error.message}`);
    }
  }

  async searchBooks(query, options = {}) {
    try {
      const params = { search: query, ...options };
      const response = await this.api.get('/books', { params });
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
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

  
  async getLibraries() {
    try {
      const response = await this.api.get('/libraries');
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  }

  async getLibraryById(id) {
    try {
      const response = await this.api.get(`/libraries/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async createLibrary(libraryData) {
    try {
      const response = await this.api.post('/libraries', libraryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateLibrary(id, libraryData) {
    try {
      const response = await this.api.put(`/libraries/${id}`, libraryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  async testConnection() {
    try {
      const response = await this.api.get('/books/stats');
      return {
        success: true,
        message: 'API connection successful',
        stats: response.data.data,
        baseURL: this.baseURL
      };
    } catch (error) {
      return {
        success: false,
        message: `Unable to connect to the API (${this.baseURL})`,
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