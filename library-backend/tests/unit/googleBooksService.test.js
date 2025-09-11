// tests/unit/googleBooksService.test.js
const googleBooksService = require('../../src/services/googleBooksService');

// Mock axios pour éviter les vraies requêtes HTTP
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

    await expect(googleBooksService.searchBooks('test')).rejects.toThrow('Impossible de rechercher les livres');
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
});