import axios from 'axios';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

class GoogleBooksService {
  // Recherche par titre ou auteur
  async searchBooks(query, maxResults = 10) {
    try {
      const response = await axios.get(GOOGLE_BOOKS_API_URL, {
        params: {
          q: query,
          maxResults,
          langRestrict: 'fr', // Priorité au français
        },
      });

      return this.formatSearchResults(response.data.items || []);
    } catch (error) {
      console.error('Erreur recherche Google Books:', error);
      throw new Error('Impossible de rechercher les livres');
    }
  }

  // Recherche par ISBN (très utile pour le scan !)
  async searchByISBN(isbn) {
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, ''); // Nettoie l'ISBN
      const response = await axios.get(GOOGLE_BOOKS_API_URL, {
        params: {
          q: `isbn:${cleanISBN}`,
        },
      });

      const items = response.data.items;
      if (items && items.length > 0) {
        return this.formatBookInfo(items[0]);
      }
      return null;
    } catch (error) {
      console.error('Erreur recherche ISBN:', error);
      return null;
    }
  }

  // Récupère les détails complets d'un livre
  async getBookDetails(volumeId) {
    try {
      const response = await axios.get(`${GOOGLE_BOOKS_API_URL}/${volumeId}`);
      return this.formatBookInfo(response.data);
    } catch (error) {
      console.error('Erreur détails livre:', error);
      throw new Error('Impossible de récupérer les détails du livre');
    }
  }

  // Formate les résultats de recherche
  formatSearchResults(items) {
    return items.map(item => this.formatBookInfo(item));
  }

  // Formate les informations d'un livre
  formatBookInfo(item) {
    const volumeInfo = item.volumeInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};

    return {
      id: item.id,
      googleBooksId: item.id,
      title: volumeInfo.title || 'Titre non disponible',
      subtitle: volumeInfo.subtitle || '',
      authors: volumeInfo.authors || ['Auteur inconnu'],
      author: (volumeInfo.authors || ['Auteur inconnu']).join(', '),
      publisher: volumeInfo.publisher || '',
      publishedDate: volumeInfo.publishedDate || '',
      description: volumeInfo.description || 'Aucune description disponible',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || [],
      genre: (volumeInfo.categories || ['Non classé'])[0],
      language: volumeInfo.language || 'fr',
      
      // Images de couverture (plusieurs tailles disponibles !)
      cover: imageLinks.thumbnail || 
             imageLinks.small || 
             imageLinks.medium || 
             imageLinks.large || 
             imageLinks.extraLarge || 
             null,
      
      coverSmall: imageLinks.smallThumbnail || imageLinks.thumbnail,
      coverLarge: imageLinks.large || imageLinks.medium || imageLinks.thumbnail,
      
      // Identifiants
      isbn10: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_10'),
      isbn13: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_13'),
      
      // Métadonnées Google Books
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      
      // Disponibilité (par défaut)
      status: 'available',
      
      // Pour compatibilité avec ton système actuel
      date: volumeInfo.publishedDate,
    };
  }

  // Extrait l'ISBN du bon type
  extractISBN(identifiers, type) {
    if (!identifiers) return null;
    const isbn = identifiers.find(id => id.type === type);
    return isbn ? isbn.identifier : null;
  }

  // Recherche avec suggestions (pour l'autocomplétion)
  async searchWithSuggestions(query) {
    if (query.length < 2) return [];
    
    try {
      const results = await this.searchBooks(query, 5);
      return results.map(book => ({
        title: book.title,
        author: book.author,
        suggestion: `${book.title} - ${book.author}`,
        book: book,
      }));
    } catch (error) {
      console.error('Erreur suggestions:', error);
      return [];
    }
  }
}

export default new GoogleBooksService();

// Exemple d'utilisation :
/*
import googleBooksService from './googleBooksService';

// Recherche par titre
const books = await googleBooksService.searchBooks('harry potter');

// Recherche par ISBN (parfait pour le scan)
const book = await googleBooksService.searchByISBN('9782070584628');

// Détails complets
const details = await googleBooksService.getBookDetails('volumeId');
*/