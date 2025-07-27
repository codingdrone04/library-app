// src/services/bookService.js
import apiService from './apiService';
import mockDataService from './mockDataService';

class BookService {
  constructor() {
    // Toggle entre API et mock data
    this.useAPI = true; // Change en false pour revenir au mock
  }

  // ===== MÉTHODES PRINCIPALES =====

  // Récupérer tous les livres de la bibliothèque
  async getLibraryBooks(options = {}) {
    try {
      if (this.useAPI) {
        console.log('📡 Utilisation de l\'API backend');
        const result = await apiService.getBooks(options);
        return result.books;
      } else {
        console.log('🔧 Utilisation des données mock');
        return await mockDataService.getAllBooks();
      }
    } catch (error) {
      console.error('❌ Erreur getLibraryBooks:', error);
      
      // Fallback vers mock en cas d'erreur API
      if (this.useAPI) {
        console.log('⚠️ Fallback vers données mock');
        return await mockDataService.getAllBooks();
      }
      
      throw error;
    }
  }

  // Recherche dans la bibliothèque
  async searchLibraryBooks(query, options = {}) {
    try {
      if (this.useAPI) {
        return await apiService.searchBooks(query, options);
      } else {
        return await mockDataService.searchBooks(query);
      }
    } catch (error) {
      console.error('❌ Erreur searchLibraryBooks:', error);
      
      // Fallback vers mock
      if (this.useAPI) {
        console.log('⚠️ Fallback vers recherche mock');
        return await mockDataService.searchBooks(query);
      }
      
      return [];
    }
  }

  // Récupérer les livres populaires
  async getPopularBooks(limit = 10) {
    try {
      if (this.useAPI) {
        return await apiService.getPopularBooks(limit);
      } else {
        const allBooks = await mockDataService.getAllBooks();
        return allBooks.filter(book => book.status === 'available').slice(0, limit);
      }
    } catch (error) {
      console.error('❌ Erreur getPopularBooks:', error);
      
      if (this.useAPI) {
        const allBooks = await mockDataService.getAllBooks();
        return allBooks.filter(book => book.status === 'available').slice(0, limit);
      }
      
      return [];
    }
  }

  // Récupérer les nouveautés
  async getRecentBooks(limit = 10) {
    try {
      if (this.useAPI) {
        return await apiService.getRecentBooks(limit);
      } else {
        const allBooks = await mockDataService.getAllBooks();
        return allBooks
          .filter(book => {
            const acquisitionDate = new Date(book.acquisitionDate || book.library?.acquisitionDate);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return acquisitionDate > oneMonthAgo;
          })
          .slice(0, limit);
      }
    } catch (error) {
      console.error('❌ Erreur getRecentBooks:', error);
      return [];
    }
  }

  // Récupérer un livre par ID
  async getBookById(id) {
    try {
      if (this.useAPI) {
        const result = await apiService.getBookById(id);
        return result.book;
      } else {
        const allBooks = await mockDataService.getAllBooks();
        return allBooks.find(book => book.id === id || book._id === id);
      }
    } catch (error) {
      console.error('❌ Erreur getBookById:', error);
      return null;
    }
  }

  // Ajouter un livre (bibliothécaires)
  async addBookToLibrary(bookData) {
    try {
      if (this.useAPI) {
        return await apiService.addBook(bookData);
      } else {
        return await mockDataService.addBook(bookData);
      }
    } catch (error) {
      console.error('❌ Erreur addBookToLibrary:', error);
      throw error;
    }
  }

  // Modifier un livre
  async updateBook(id, bookData) {
    try {
      if (this.useAPI) {
        return await apiService.updateBook(id, bookData);
      } else {
        // TODO: Implémenter dans mock
        throw new Error('Modification non supportée en mode mock');
      }
    } catch (error) {
      console.error('❌ Erreur updateBook:', error);
      throw error;
    }
  }

  // Supprimer un livre
  async deleteBook(id) {
    try {
      if (this.useAPI) {
        return await apiService.deleteBook(id);
      } else {
        throw new Error('Suppression non supportée en mode mock');
      }
    } catch (error) {
      console.error('❌ Erreur deleteBook:', error);
      throw error;
    }
  }

  // ===== EMPRUNTS (TEMPORAIRE - MOCK) =====

  // Emprunter un livre
  async borrowBook(bookId, userId) {
    try {
      if (this.useAPI) {
        // TODO: Utiliser l'API quand les routes d'emprunts seront prêtes
        // return await apiService.borrowBook(bookId, userId);
        
        // Pour le moment, utiliser le mock
        console.log('📚 Emprunt via mock (routes API pas encore prêtes)');
        return await mockDataService.borrowBook(bookId, userId);
      } else {
        return await mockDataService.borrowBook(bookId, userId);
      }
    } catch (error) {
      console.error('❌ Erreur borrowBook:', error);
      throw error;
    }
  }

  // Retourner un livre
  async returnBook(bookId, userId) {
    try {
      if (this.useAPI) {
        // TODO: Utiliser l'API quand les routes d'emprunts seront prêtes
        console.log('📚 Retour via mock (routes API pas encore prêtes)');
        return await mockDataService.returnBook(bookId, userId);
      } else {
        return await mockDataService.returnBook(bookId, userId);
      }
    } catch (error) {
      console.error('❌ Erreur returnBook:', error);
      throw error;
    }
  }

  // Récupérer les livres empruntés par un utilisateur
  async getUserBorrowedBooks(userId) {
    try {
      if (this.useAPI) {
        // TODO: Utiliser l'API quand les routes d'emprunts seront prêtes
        console.log('📚 Livres empruntés via mock (routes API pas encore prêtes)');
        return await mockDataService.getUserBorrowedBooks(userId);
      } else {
        return await mockDataService.getUserBorrowedBooks(userId);
      }
    } catch (error) {
      console.error('❌ Erreur getUserBorrowedBooks:', error);
      return [];
    }
  }

  // ===== STATISTIQUES =====

  // Obtenir les statistiques de la bibliothèque
  async getLibraryStats() {
    try {
      if (this.useAPI) {
        return await apiService.getLibraryStats();
      } else {
        return await mockDataService.getLibraryStats();
      }
    } catch (error) {
      console.error('❌ Erreur getLibraryStats:', error);
      return {};
    }
  }

  // ===== UTILITAIRES =====

  // Test de connexion API
  async testConnection() {
    try {
      if (this.useAPI) {
        return await apiService.testConnection();
      } else {
        return {
          success: true,
          message: 'Mode mock activé',
          mock: true
        };
      }
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
      if (this.useAPI) {
        return await apiService.enrichBook(id);
      } else {
        throw new Error('Enrichissement non supporté en mode mock');
      }
    } catch (error) {
      console.error('❌ Erreur enrichBook:', error);
      throw error;
    }
  }

  // Obtenir suggestions de recherche
  async getSearchSuggestions(query) {
    try {
      if (this.useAPI) {
        return await apiService.getSearchSuggestions(query);
      } else {
        // Recherche simple dans les données mock
        const books = await mockDataService.searchBooks(query);
        return {
          local: books.slice(0, 3).map(book => ({
            title: book.title,
            author: book.author || book.authors?.[0],
            suggestion: `${book.title} - ${book.author || book.authors?.[0]}`,
            inLibrary: true,
            book: book
          })),
          external: []
        };
      }
    } catch (error) {
      console.error('❌ Erreur getSearchSuggestions:', error);
      return { local: [], external: [] };
    }
  }

  // ===== CONFIGURATION =====

  // Activer/désactiver l'API
  setUseAPI(useAPI) {
    this.useAPI = useAPI;
    console.log(`🔧 Mode API: ${useAPI ? 'ON' : 'OFF (mock)'}`);
  }

  // Vérifier si on utilise l'API
  isUsingAPI() {
    return this.useAPI;
  }

  // Obtenir l'URL de l'API
  getAPIUrl() {
    return apiService.getBaseURL();
  }
}

export default new BookService();