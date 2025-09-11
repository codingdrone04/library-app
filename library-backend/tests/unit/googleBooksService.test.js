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

// tests/unit/bookRoutes.test.js  
const request = require('supertest');
const express = require('express');
const bookRoutes = require('../../src/routes/books');

// Mock du modèle Book
jest.mock('../../src/models/Book');
const Book = require('../../src/models/Book');

describe('Book Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/books', bookRoutes);
    jest.clearAllMocks();
  });

  test('GET /api/books should return books', async () => {
    const mockBooks = [
      { _id: '1', title: 'Book 1', authors: ['Author 1'] },
      { _id: '2', title: 'Book 2', authors: ['Author 2'] }
    ];

    Book.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockBooks)
          })
        })
      })
    });

    Book.countDocuments.mockResolvedValue(2);

    const response = await request(app)
      .get('/api/books')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  test('GET /api/books should handle errors', async () => {
    Book.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            exec: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })
    });

    const response = await request(app)
      .get('/api/books')
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});

// tests/integration/errorHandling.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Error Handling', () => {
  test('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.body.error).toBe('Route not found');
  });

  test('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/books')
      .send('invalid json')
      .set('Content-Type', 'application/json')
      .expect(400);
  });
});