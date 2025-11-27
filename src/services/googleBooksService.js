import axios from 'axios';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

class GoogleBooksService {
  async searchBooks(query, maxResults = 10) {
    try {
      const response = await axios.get(GOOGLE_BOOKS_API_URL, {
        params: {
          q: query,
          maxResults,
          langRestrict: 'fr', // Priority to French language
        },
      });

      return this.formatSearchResults(response.data.items || []);
    } catch (error) {
      console.error('Google Books search error:', error);
      throw new Error('Unable to search for books');
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
      console.error('ISBN search error:', error);
      return null;
    }
  }

  async getBookDetails(volumeId) {
    try {
      const response = await axios.get(`${GOOGLE_BOOKS_API_URL}/${volumeId}`);
      return this.formatBookInfo(response.data);
    } catch (error) {
      console.error('Book details error:', error);
      throw new Error('Unable to retrieve book details');
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
      title: volumeInfo.title || 'Title unavailable',
      subtitle: volumeInfo.subtitle || '',
      authors: volumeInfo.authors || ['Unknown author'],
      author: (volumeInfo.authors || ['Unknown author']).join(', '),
      publisher: volumeInfo.publisher || '',
      publishedDate: volumeInfo.publishedDate || '',
      description: volumeInfo.description || 'No description available',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || [],
      genre: (volumeInfo.categories || ['Uncategorized'])[0],
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
      console.error('Suggestions error:', error);
      return [];
    }
  }
}

export default new GoogleBooksService();