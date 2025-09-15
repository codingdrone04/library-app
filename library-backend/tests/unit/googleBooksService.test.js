const googleBooksService = require('../../src/services/googleBooksService');

jest.mock('axios');
const axios = require('axios');

describe('Google Books Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should search books successfully', async () => {
    const mockResponse = {
      data: {
        items: [{
          id: 'test-id',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Test Author'],
            description: 'Test description'
          }
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);

    const results = await googleBooksService.searchBooks('test query');
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Test Book');
    expect(results[0].authors).toEqual(['Test Author']);
  });

  test('should handle search errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    await expect(googleBooksService.searchBooks('test')).rejects.toThrow('Impossible de rechercher sur Google Books');
  });

  test('should search by ISBN', async () => {
    const mockResponse = {
      data: {
        items: [{
          id: 'isbn-book',
          volumeInfo: {
            title: 'ISBN Book',
            authors: ['ISBN Author'],
            industryIdentifiers: [
              { type: 'ISBN_13', identifier: '9781234567890' }
            ]
          }
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);

    const result = await googleBooksService.searchByISBN('9781234567890');
    
    expect(result).toBeTruthy();
    expect(result.title).toBe('ISBN Book');
  });

  test('should return null for ISBN not found', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const result = await googleBooksService.searchByISBN('0000000000');
    
    expect(result).toBeNull();
  });

  test('should format book data correctly', async () => {
    const mockResponse = {
      data: {
        items: [{
          id: 'format-test-id',
          volumeInfo: {
            title: 'Format Test Book',
            subtitle: 'Test Subtitle',
            authors: ['Author One', 'Author Two'],
            publisher: 'Test Publisher',
            publishedDate: '2023',
            description: 'Test description with <b>HTML</b> tags',
            pageCount: 300,
            categories: ['Fiction', 'Adventure'],
            language: 'en',
            industryIdentifiers: [
              { type: 'ISBN_10', identifier: '1234567890' },
              { type: 'ISBN_13', identifier: '9781234567890' }
            ],
            imageLinks: {
              thumbnail: 'http://example.com/thumbnail.jpg',
              small: 'http://example.com/small.jpg'
            },
            averageRating: 4.5,
            ratingsCount: 100
          }
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);

    const results = await googleBooksService.searchBooks('format test');
    const book = results[0];
    
    expect(book.title).toBe('Format Test Book');
    expect(book.subtitle).toBe('Test Subtitle');
    expect(book.authors).toEqual(['Author One', 'Author Two']);
    expect(book.publisher).toBe('Test Publisher');
    expect(book.pageCount).toBe(300);
    expect(book.categories).toEqual(['Fiction', 'Adventure']);
    expect(book.genre).toBe('Fiction');
    expect(book.cover).toBe('http://example.com/thumbnail.jpg');
    expect(book.googleBooks?.averageRating).toBe(4.5);
    expect(book.ratingsCount).toBe(100);
    
    expect(book.description).toBe('Test description with  tags');
  });

  test('should handle books without complete data', async () => {
    const mockResponse = {
      data: {
        items: [{
          id: 'incomplete-book',
          volumeInfo: {
            title: 'Incomplete Book'
          }
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);

    const results = await googleBooksService.searchBooks('incomplete');
    const book = results[0];
    
    expect(book.title).toBe('Incomplete Book');
    expect(book.authors).toEqual(['Auteur inconnu']);
    expect(book.description).toBe('');
    expect(book.categories).toEqual([]);
    expect(book.genre).toBe('Non classé');
    expect(book.cover).toBeNull();
  });

  test('should validate ISBN format', () => {
    expect(googleBooksService.isValidISBN('9781234567890')).toBe(true);
    expect(googleBooksService.isValidISBN('1234567890')).toBe(true);
    expect(googleBooksService.isValidISBN('978-1-234-56789-0')).toBe(true);
    expect(googleBooksService.isValidISBN('invalid')).toBe(false);
    expect(googleBooksService.isValidISBN('123')).toBe(false);
  });

  test('should clean ISBN correctly', () => {
    expect(googleBooksService.cleanISBN('978-1-234-56789-0')).toBe('9781234567890');
    expect(googleBooksService.cleanISBN('1 234 567890')).toBe('1234567890');
    expect(googleBooksService.cleanISBN('978-1-234-56789-x')).toBe('978123456789X');
  });
});