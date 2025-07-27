import axios from 'axios';
import { API_CONFIG } from '../constants';

class ApiService {
  constructor() {
    // Configuration de base
    this.baseURL = __DEV__ 
      ? 'http://localhost:3000/api'  // Développement
      : API_CONFIG.BASE_URL;         // Production
    
    // Instance axios
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Intercepteurs pour logging et gestion d'erreurs
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor - pour ajouter auth token plus tard
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

    // Response interceptor - pour gérer les erreurs globalement
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Error:', error.response?.data || error.message);
        
        // Gestion des erreurs communes
        if (error.response?.status === 401) {
          // TODO: Rediriger vers login
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
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
        status: 0,
        network: true
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Une erreur est survenue',
        status: -1
      };
    }
  }

  // ===== MÉTHODES LIVRES =====

  // Récupérer tous les livres avec filtres et pagination
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

  // Récupérer les livres populaires
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

  // Récupérer les nouveautés
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

  // Rechercher des livres
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

  // Obtenir suggestions d'autocomplétion
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

  // Récupérer un livre par ID
  async getBookById(id) {
    try {
      const response = await this.api.get(`/books/${id}`);
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Ajouter un nouveau livre (bibliothécaires)
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

  // Modifier un livre
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

  // Supprimer un livre
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

  // Enrichir un livre avec Google Books
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

  // Obtenir statistiques de la bibliothèque
  async getLibraryStats() {
    try {
      const response = await this.api.get('/books/stats');
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTHODES EMPRUNTS (TODO) =====

  // Emprunter un livre
  async borrowBook(bookId, userId) {
    try {
      // TODO: Implémenter quand on aura les routes d'emprunts
      const response = await this.api.post('/loans', {
        bookId,
        userId
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Retourner un livre
  async returnBook(bookId, userId) {
    try {
      // TODO: Implémenter quand on aura les routes d'emprunts
      const response = await this.api.patch(`/loans/${bookId}/return`, {
        userId
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer les livres empruntés par un utilisateur
  async getUserBorrowedBooks(userId) {
    try {
      // TODO: Implémenter quand on aura les routes d'emprunts
      const response = await this.api.get(`/loans/user/${userId}`);
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTHODES UTILISATEURS (TODO) =====

  // Login
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

  // Register
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===== UTILITAIRES =====

  // Test de connexion
  async testConnection() {
    try {
      const response = await this.api.get('/books/stats');
      
      return {
        success: true,
        message: 'Connexion API réussie',
        stats: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Impossible de se connecter à l\'API',
        error: error.message
      };
    }
  }

  // Obtenir l'URL de base
  getBaseURL() {
    return this.baseURL;
  }

  // Vérifier si on est en développement
  isDevelopment() {
    return __DEV__;
  }
}

export default new ApiService();