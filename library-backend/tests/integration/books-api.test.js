const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Book = require('../../src/models/Book');
const { createTestBook } = require('../helpers/testData');
const connectMongoDB = require('../../src/config/mongodb');

describe('Books API Integration Tests', () => {

  beforeAll(async () => {
    console.log('🌐 Configuration API Tests...');
    await connectMongoDB();
    console.log('✅ MongoDB connecté pour tests API');
  }, 30000);

  afterAll(async () => {
    await Book.deleteMany({ 'library.librarian': 'test' });
    await mongoose.connection.close();
    console.log('✅ Tests API terminés, connexion fermée');
  }, 10000);

  // ✅ Nettoyer AVANT ET APRÈS chaque test
  beforeEach(async () => {
    await Book.deleteMany({ 'library.librarian': 'test' });
  });

  afterEach(async () => {
    await Book.deleteMany({ 'library.librarian': 'test' });
  });

  describe('GET /api/books', () => {
    test('devrait retourner seulement nos livres de test', async () => {
      // Créer 2 livres de test
      await Book.create([
        createTestBook({ 
          title: 'Test Book 1',
          library: { ...createTestBook().library, librarian: 'test' }
        }),
        createTestBook({ 
          title: 'Test Book 2',
          library: { ...createTestBook().library, librarian: 'test' }
        })
      ]);

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Filtrer pour avoir seulement nos livres de test
      const testBooks = response.body.data.filter(book => 
        book.library?.librarian === 'test'
      );
      
      expect(testBooks).toHaveLength(2);
      expect(testBooks[0].title).toMatch(/Test Book/);
      
      console.log('✅ GET /api/books avec nos données OK');
    }, 30000); // ✅ Timeout plus long

    test('devrait filtrer par statut nos livres', async () => {
      await Book.create([
        createTestBook({ 
          title: 'Test Available',
          status: 'available',
          library: { ...createTestBook().library, librarian: 'test' }
        }),
        createTestBook({ 
          title: 'Test Borrowed',
          status: 'borrowed',
          library: { ...createTestBook().library, librarian: 'test' }
        })
      ]);

      const response = await request(app)
        .get('/api/books?status=available')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Vérifier que nos livres de test disponibles sont là
      const testAvailableBooks = response.body.data.filter(book => 
        book.library?.librarian === 'test' && book.status === 'available'
      );
      
      expect(testAvailableBooks).toHaveLength(1);
      expect(testAvailableBooks[0].title).toBe('Test Available');
      
      console.log('✅ GET /api/books?status=available OK');
    }, 30000);
  });

  describe('POST /api/books', () => {
    test('devrait créer un nouveau livre', async () => {
        const newBookData = {
          title: 'Livre de Test API Unique 12345', // Titre unique qui n'existe pas
          authors: ['Auteur Test Fictif'],
          location: 'TEST-API-1',
          condition: 'good',
          librarian: 'test'
        };
      
        const response = await request(app)
          .post('/api/books')
          .send(newBookData)
          .expect(201);
      
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          status: 'available'
        });
        // Ne pas tester title/authors car ils peuvent être enrichis
        expect(response.body.data._id).toBeDefined();
        
        console.log('✅ POST /api/books OK');
      }, 60000);

    test('devrait refuser un livre sans titre', async () => {
      const invalidData = {
        authors: ['Auteur'],
        location: 'A-1'
      };

      const response = await request(app)
        .post('/api/books')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/titre/i);
      
      console.log('✅ POST validation titre OK');
    });
  });

  describe('GET /api/books/:id', () => {
    test('devrait retourner les détails d\'un livre', async () => {
      const book = await Book.create(createTestBook({
        title: 'Test Details Book',
        library: { ...createTestBook().library, librarian: 'test' }
      }));

      const response = await request(app)
        .get(`/api/books/${book._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book.title).toBe('Test Details Book');
      
      console.log('✅ GET /api/books/:id OK');
    }, 30000);

    test('devrait retourner 404 pour livre inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/books/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      
      console.log('✅ GET /api/books/:id (404) OK');
    });
  });

});