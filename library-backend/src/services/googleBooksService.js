const axios = require('axios');

class GoogleBooksService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/books/v1/volumes';
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY; // Optionnel
  }

  async searchBooks(query, maxResults = 10) {
    try {
      const params = {
        q: query,
        maxResults: Math.min(maxResults, 40), // Limite Google Books
        langRestrict: 'fr', // Priorité français
        printType: 'books',
        orderBy: 'relevance'
      };

      if (this.apiKey) {
        params.key = this.apiKey;
      }

      console.log(`🔍 Recherche Google Books: "${query}"`);
      
      const response = await axios.get(this.baseURL, {
        params,
        timeout: 10000
      });

      if (!response.data.items) {
        console.log('❌ Aucun résultat trouvé');
        return [];
      }

      const books = response.data.items.map(item => this.formatBookData(item));
      console.log(`✅ ${books.length} livres trouvés`);
      
      return books;
    } catch (error) {
      console.error('❌ Erreur recherche Google Books:', error.message);
      throw new Error('Impossible de rechercher sur Google Books');
    }
  }

  async searchByISBN(isbn) {
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      console.log(`📖 Recherche par ISBN: ${cleanISBN}`);
      
      const results = await this.searchBooks(`isbn:${cleanISBN}`, 1);
      
      if (results.length > 0) {
        console.log(`✅ Livre trouvé pour ISBN ${cleanISBN}`);
        return results[0];
      }
      
      console.log(`❌ Aucun livre trouvé pour ISBN ${cleanISBN}`);
      return null;
    } catch (error) {
      console.error('❌ Erreur recherche ISBN:', error.message);
      return null;
    }
  }

  async getBookDetails(volumeId) {
    try {
      console.log(`📚 Récupération détails: ${volumeId}`);
      
      const params = {};
      if (this.apiKey) {
        params.key = this.apiKey;
      }

      const response = await axios.get(`${this.baseURL}/${volumeId}`, {
        params,
        timeout: 10000
      });

      const book = this.formatBookData(response.data);
      console.log(`✅ Détails récupérés: ${book.title}`);
      
      return book;
    } catch (error) {
      console.error('❌ Erreur détails livre:', error.message);
      throw new Error('Impossible de récupérer les détails du livre');
    }
  }

  formatBookData(item) {
    const volumeInfo = item.volumeInfo || {};
    const accessInfo = item.accessInfo || {};
    
    const identifiers = [];
    if (volumeInfo.industryIdentifiers) {
      volumeInfo.industryIdentifiers.forEach(id => {
        identifiers.push({
          type: id.type,
          identifier: id.identifier
        });
      });
    }

    const imageLinks = volumeInfo.imageLinks || {};
    const cover = imageLinks.thumbnail ||
                  imageLinks.small ||
                  imageLinks.medium ||
                  imageLinks.large ||
                  imageLinks.extraLarge ||
                  null;

    let description = volumeInfo.description || '';
    if (description) {
      description = description.replace(/<[^>]*>/g, ''); // Remove HTML tags
      description = description.replace(/&[^;]+;/g, ' '); // Remove HTML entities
      description = description.trim();
    }

    return {
      title: volumeInfo.title || 'Titre inconnu',
      subtitle: volumeInfo.subtitle || '',
      authors: volumeInfo.authors || ['Auteur inconnu'],
      description,
      
      categories: volumeInfo.categories || [],
      genre: volumeInfo.categories ? volumeInfo.categories[0] : 'Non classé',
      language: volumeInfo.language || 'fr',
      
      publisher: volumeInfo.publisher || '',
      publishedDate: volumeInfo.publishedDate || '',
      pageCount: volumeInfo.pageCount || 0,
      
      identifiers,
      
      cover,
      
      googleBooks: {
        googleBooksId: item.id,
        previewLink: volumeInfo.previewLink,
        infoLink: volumeInfo.infoLink,
        canonicalVolumeLink: volumeInfo.canonicalVolumeLink,
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        maturityRating: volumeInfo.maturityRating,
        allowAnonLogging: accessInfo.allowAnonLogging,
        contentVersion: volumeInfo.contentVersion,
        imageLinks
      },
      
      isEnriched: true,
      lastEnrichmentDate: new Date()
    };
  }

  async findSimilarBooks(book, maxResults = 6) {
    try {
      let queries = [];
      
      if (book.categories && book.categories.length > 0) {
        queries.push(`subject:${book.categories[0]}`);
      }
      
      if (book.authors && book.authors.length > 0) {
        queries.push(`inauthor:${book.authors[0]}`);
      }
      
      if (book.genre) {
        queries.push(book.genre);
      }
      
      for (const query of queries) {
        const results = await this.searchBooks(query, maxResults * 2);
        
        const filtered = results.filter(result => 
          result.googleBooks?.googleBooksId !== book.googleBooks?.googleBooksId &&
          result.title !== book.title
        );
        
        if (filtered.length >= maxResults) {
          return filtered.slice(0, maxResults);
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur recherche livres similaires:', error.message);
      return [];
    }
  }

  async getSearchSuggestions(query, maxResults = 5) {
    try {
      if (query.length < 2) return [];
      
      const results = await this.searchBooks(query, maxResults);
      
      return results.map(book => ({
        title: book.title,
        author: book.authors[0],
        suggestion: `${book.title} - ${book.authors[0]}`,
        book: book
      }));
    } catch (error) {
      console.error('❌ Erreur suggestions:', error.message);
      return [];
    }
  }

  isValidISBN(isbn) {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    return /^(97[89])?\d{9}[\dX]$/.test(cleanISBN);
  }

  cleanISBN(isbn) {
    return isbn.replace(/[-\s]/g, '').toUpperCase();
  }
}

module.exports = new GoogleBooksService();