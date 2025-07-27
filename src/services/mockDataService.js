import AsyncStorage from '@react-native-async-storage/async-storage';
import googleBooksService from './googleBooksService';

const STORAGE_KEYS = {
  LIBRARY_BOOKS: '@library_books',
  BORROWED_BOOKS: '@borrowed_books',
  BOOK_COUNTER: '@book_counter',
};

class MockDataService {
  constructor() {
    // Ne pas appeler initializeData() dans le constructor
    // car c'est async et peut causer des problèmes
  }

  // Initialise avec quelques livres si c'est la première fois
  async initializeData() {
    try {
      const existingBooks = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY_BOOKS);
      
      if (!existingBooks) {
        // Première fois - créer quelques livres de base
        console.log('🆕 Première initialisation de la bibliothèque...');
        const initialBooks = await this.createInitialLibrary();
        await this.saveBooks(initialBooks);
        console.log('📚 Bibliothèque initialisée avec', initialBooks.length, 'livres');
      } else {
        console.log('📖 Bibliothèque existante trouvée');
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  // Crée une bibliothèque initiale avec quelques livres populaires
  async createInitialLibrary() {
    const bookQueries = [
      'Le Petit Prince Antoine',
      '1984 George Orwell',
      'Harry Potter philosopher stone',
      'Clean Code Robert Martin',
      'The Art of War Sun Tzu',
      'Pride and Prejudice Jane Austen',
    ];

    const books = [];
    let bookId = 1;

    for (const query of bookQueries) {
      try {
        console.log(`🔍 Recherche de "${query}" sur Google Books...`);
        const googleResults = await googleBooksService.searchBooks(query, 1);
        
        if (googleResults.length > 0) {
          const googleBook = googleResults[0];
          
          const libraryBook = {
            // Données locales (bibliothèque)
            id: bookId++,
            status: Math.random() > 0.3 ? 'available' : 'borrowed', // 70% dispo
            location: `Rayon ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 20) + 1}`,
            acquisitionDate: this.randomDateInPast(365),
            
            // Données enrichies Google Books
            ...googleBook,
            
            // Override avec données spécifiques à ta bibliothèque
            library_specific: {
              condition: 'good', // good, fair, poor
              notes: '',
              price: Math.floor(Math.random() * 25) + 5, // Prix d'achat
            }
          };
          
          books.push(libraryBook);
          console.log(`✅ Ajouté: ${libraryBook.title}`);
        }
        
        // Pause pour éviter de spammer l'API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Erreur pour "${query}":`, error);
      }
    }

    return books;
  }

  // Sauvegarde les livres
  async saveBooks(books) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LIBRARY_BOOKS, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving books:', error);
    }
  }

  // Récupère tous les livres
  async getAllBooks() {
    try {
      const booksJson = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY_BOOKS);
      return booksJson ? JSON.parse(booksJson) : [];
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  // Recherche dans la bibliothèque
  async searchBooks(query) {
    try {
      const allBooks = await this.getAllBooks();
      
      return allBooks.filter(book => 
        book.title?.toLowerCase().includes(query.toLowerCase()) ||
        book.author?.toLowerCase().includes(query.toLowerCase()) ||
        book.genre?.toLowerCase().includes(query.toLowerCase()) ||
        book.categories?.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }

  // Ajoute un nouveau livre (pour les bibliothécaires)
  async addBook(bookData) {
    try {
      const allBooks = await this.getAllBooks();
      const newId = Math.max(...allBooks.map(b => b.id), 0) + 1;
      
      let enrichedBook = {
        id: newId,
        status: 'available',
        location: bookData.location || `Rayon A-${Math.floor(Math.random() * 20) + 1}`,
        acquisitionDate: new Date().toISOString(),
        library_specific: {
          condition: 'good',
          notes: bookData.notes || '',
          price: bookData.price || 0,
        },
        ...bookData,
      };

      // Essayer d'enrichir avec Google Books si on a un ISBN ou titre/auteur
      if (bookData.isbn || (bookData.title && bookData.author)) {
        try {
          const searchQuery = bookData.isbn || `${bookData.title} ${bookData.author}`;
          const googleResults = await googleBooksService.searchBooks(searchQuery, 1);
          
          if (googleResults.length > 0) {
            const googleBook = googleResults[0];
            enrichedBook = {
              ...enrichedBook,
              ...googleBook,
              // Garder les données locales prioritaires
              id: newId,
              status: enrichedBook.status,
              location: enrichedBook.location,
              acquisitionDate: enrichedBook.acquisitionDate,
              library_specific: enrichedBook.library_specific,
            };
          }
        } catch (error) {
          console.warn('Could not enrich with Google Books:', error);
        }
      }

      allBooks.push(enrichedBook);
      await this.saveBooks(allBooks);
      
      return {
        success: true,
        book: enrichedBook,
      };
    } catch (error) {
      console.error('Error adding book:', error);
      throw new Error('Impossible d\'ajouter le livre');
    }
  }

  // Emprunte un livre
  async borrowBook(bookId, userId) {
    try {
      const allBooks = await this.getAllBooks();
      const bookIndex = allBooks.findIndex(book => book.id === bookId);
      
      if (bookIndex === -1) {
        throw new Error('Livre non trouvé');
      }
      
      if (allBooks[bookIndex].status !== 'available') {
        throw new Error('Ce livre n\'est pas disponible');
      }
      
      // Mettre à jour le statut
      allBooks[bookIndex].status = 'borrowed';
      allBooks[bookIndex].borrowedBy = userId;
      allBooks[bookIndex].borrowDate = new Date().toISOString();
      
      // Date de retour : 2 semaines plus tard
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 14);
      allBooks[bookIndex].returnDate = returnDate.toISOString();
      
      await this.saveBooks(allBooks);
      
      return {
        success: true,
        borrowDate: allBooks[bookIndex].borrowDate,
        returnDate: allBooks[bookIndex].returnDate,
      };
    } catch (error) {
      console.error('Error borrowing book:', error);
      throw error;
    }
  }

  // Retourne un livre
  async returnBook(bookId, userId) {
    try {
      const allBooks = await this.getAllBooks();
      const bookIndex = allBooks.findIndex(book => book.id === bookId);
      
      if (bookIndex === -1) {
        throw new Error('Livre non trouvé');
      }
      
      if (allBooks[bookIndex].borrowedBy !== userId) {
        throw new Error('Ce livre n\'est pas emprunté par cet utilisateur');
      }
      
      // Remettre disponible
      allBooks[bookIndex].status = 'available';
      delete allBooks[bookIndex].borrowedBy;
      delete allBooks[bookIndex].borrowDate;
      delete allBooks[bookIndex].returnDate;
      allBooks[bookIndex].lastReturnDate = new Date().toISOString();
      
      await this.saveBooks(allBooks);
      
      return {
        success: true,
        returnDate: allBooks[bookIndex].lastReturnDate,
      };
    } catch (error) {
      console.error('Error returning book:', error);
      throw error;
    }
  }

  // Récupère les livres empruntés par un utilisateur
  async getUserBorrowedBooks(userId) {
    try {
      const allBooks = await this.getAllBooks();
      return allBooks.filter(book => book.borrowedBy === userId);
    } catch (error) {
      console.error('Error getting user borrowed books:', error);
      return [];
    }
  }

  // Fonctions d'administration (pour les bibliothécaires)
  async getLibraryStats() {
    try {
      const allBooks = await this.getAllBooks();
      
      return {
        total: allBooks.length,
        available: allBooks.filter(b => b.status === 'available').length,
        borrowed: allBooks.filter(b => b.status === 'borrowed').length,
        reserved: allBooks.filter(b => b.status === 'reserved').length,
        damaged: allBooks.filter(b => b.status === 'damaged').length,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }

  // Reset la bibliothèque (pour le développement)
  async resetLibrary() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LIBRARY_BOOKS);
      console.log('🗑️ Bibliothèque réinitialisée');
      
      // Re-créer
      const newBooks = await this.createInitialLibrary();
      await this.saveBooks(newBooks);
      
      return newBooks;
    } catch (error) {
      console.error('Error resetting library:', error);
      throw error;
    }
  }

  // Utilitaires
  randomDateInPast(maxDaysAgo) {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const date = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));
    return date.toISOString();
  }
}

export default new MockDataService();