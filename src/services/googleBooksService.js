import axios from 'axios';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

class GoogleBooksService {
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

  async searchByISBN(isbn) {
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, '');
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

  async getBookDetails(volumeId) {
    try {
      const response = await axios.get(`${GOOGLE_BOOKS_API_URL}/${volumeId}`);
      return this.formatBookInfo(response.data);
    } catch (error) {
      console.error('Erreur détails livre:', error);
      throw new Error('Impossible de récupérer les détails du livre');
    }
  }

  formatSearchResults(items) {
    return items.map(item => this.formatBookInfo(item));
  }

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
      
      cover: imageLinks.thumbnail || 
             imageLinks.small || 
             imageLinks.medium || 
             imageLinks.large || 
             imageLinks.extraLarge || 
             null,
      
      coverSmall: imageLinks.smallThumbnail || imageLinks.thumbnail,
      coverLarge: imageLinks.large || imageLinks.medium || imageLinks.thumbnail,
      
      isbn10: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_10'),
      isbn13: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_13'),
      
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      
      status: 'available',
      
      date: volumeInfo.publishedDate,
    };
  }

  extractISBN(identifiers, type) {
    if (!identifiers) return null;
    const isbn = identifiers.find(id => id.type === type);
    return isbn ? isbn.identifier : null;
  }

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