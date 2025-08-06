// src/services/bookService.js
import apiService from './apiService';

class BookService {
  constructor() {
    // Utilisation de l'API uniquement
    console.log('📚 BookService initialisé - Mode API uniquement');
  }

  // ===== MÉTHODES PRINCIPALES =====

  // Récupérer tous les livres de la bibliothèque
  async getLibraryBooks(options = {}) {
    try {
      console.log('📚 Chargement des livres depuis l\'API...');
      console.log('📍 URL:', apiService.getBaseURL());
      
      const result = await apiService.getBooks(options);
      console.log('✅ Livres récupérés:', result.books.length);
      
      return result.books;
    } catch (error) {
      console.error('❌ Erreur getLibraryBooks:', error);
      throw new Error(`Impossible de charger les livres: ${error.message}`);
    }
  }

  // Recherche dans la bibliothèque
  async searchLibraryBooks(query, options = {}) {
    try {
      console.log('🔍 Recherche:', query);
      return await apiService.searchBooks(query, options);
    } catch (error) {
      console.error('❌ Erreur searchLibraryBooks:', error);
      throw error;
    }
  }

  // Récupérer les livres populaires
  async getPopularBooks(limit = 10) {
    try {
      return await apiService.getPopularBooks(limit);
    } catch (error) {
      console.error('❌ Erreur getPopularBooks:', error);
      throw error;
    }
  }

  // Récupérer les nouveautés
  async getRecentBooks(limit = 10) {
    try {
      return await apiService.getRecentBooks(limit);
    } catch (error) {
      console.error('❌ Erreur getRecentBooks:', error);
      throw error;
    }
  }

  // Récupérer un livre par ID
  async getBookById(id) {
    try {
      const result = await apiService.getBookById(id);
      return result.book;
    } catch (error) {
      console.error('❌ Erreur getBookById:', error);
      return null;
    }
  }

  // Ajouter un livre (bibliothécaires)
  async addBookToLibrary(bookData) {
    try {
      return await apiService.addBook(bookData);
    } catch (error) {
      console.error('❌ Erreur addBookToLibrary:', error);
      throw error;
    }
  }

  // Modifier un livre
  async updateBook(id, bookData) {
    try {
      return await apiService.updateBook(id, bookData);
    } catch (error) {
      console.error('❌ Erreur updateBook:', error);
      throw error;
    }
  }

  // Supprimer un livre
  async deleteBook(id) {
    try {
      return await apiService.deleteBook(id);
    } catch (error) {
      console.error('❌ Erreur deleteBook:', error);
      throw error;
    }
  }

  // ===== EMPRUNTS =====

  // Emprunter un livre
  async borrowBook(bookId, userId) {
    try {
      return await apiService.borrowBook(bookId, userId);
    } catch (error) {
      console.error('❌ Erreur borrowBook:', error);
      throw error;
    }
  }

  // Retourner un livre
  async returnBook(bookId, userId) {
    try {
      return await apiService.returnBook(bookId, userId);
    } catch (error) {
      console.error('❌ Erreur returnBook:', error);
      throw error;
    }
  }

  // Récupérer les livres empruntés par un utilisateur
  async getUserBorrowedBooks(userId) {
    try {
      return await apiService.getUserBorrowedBooks(userId);
    } catch (error) {
      console.error('❌ Erreur getUserBorrowedBooks:', error);
      return [];
    }
  }

  // ===== STATISTIQUES =====

  // Obtenir les statistiques de la bibliothèque
  async getLibraryStats() {
    try {
      return await apiService.getLibraryStats();
    } catch (error) {
      console.error('❌ Erreur getLibraryStats:', error);
      return {};
    }
  }

  // ===== UTILITAIRES =====

  // Test de connexion API
  async testConnection() {
    try {
      return await apiService.testConnection();
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion',
        error: error.message
      };
    }
  }

  // Enrichir un livre avec Google Books
  async enrichBook(id) {
    try {
      return await apiService.enrichBook(id);
    } catch (error) {
      console.error('❌ Erreur enrichBook:', error);
      throw error;
    }
  }

  // Obtenir suggestions de recherche
  async getSearchSuggestions(query) {
    try {
      return await apiService.getSearchSuggestions(query);
    } catch (error) {
      console.error('❌ Erreur getSearchSuggestions:', error);
      return { local: [], external: [] };
    }
  }

  // ===== CONFIGURATION =====

  // Obtenir l'URL de l'API
  getAPIUrl() {
    return apiService.getBaseURL();
  }
}

export default new BookService();