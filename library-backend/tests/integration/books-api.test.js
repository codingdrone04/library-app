const request = require('supertest');
const app = require('../../src/app');
const Book = require('../../src/models/Book');
const { createTestBook } = require('../helpers/testData');
const { setupDatabase, teardownDatabase } = require('../setup');

describe('Books API Integration Tests', () => {

  beforeAll(async () => {
    console.log('🌐 Configuration API Tests...');
    
    // ✅ CORRECTION: Utiliser MongoDB Memory Server via setup
    await setupDatabase();
    
    console.log('✅ MongoDB Memory Server connecté pour tests API');
  }, 30000);

  afterAll(async () => {
    // ✅ CORRECTION: Nettoyer via teardown
    await teardownDatabase();
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
    }, 30000);

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

    // ✅ NOUVEAU TEST: Pagination
    test('devrait supporter la pagination', async () => {
      // Créer plusieurs livres
      const books = Array.from({ length: 5 }, (_, i) => 
        createTestBook({ 
          title: `Test Book ${i + 1}`,
          library: { ...createTestBook().library, librarian: 'test' }
        })
      );
      await Book.create(books);

      const response = await request(app)
        .get('/api/books?page=1&limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/books', () => {
    test('devrait créer un nouveau livre', async () => {
      const newBookData = {
        title: 'Livre de Test API Unique 12345',
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

    // ✅ NOUVEAU TEST: Validation location
    test('devrait refuser un livre sans localisation', async () => {
      const invalidData = {
        title: 'Test Book',
        authors: ['Test Author']
        // location manquante
      };

      const response = await request(app)
        .post('/api/books')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/localisation/i);
    });

    // ✅ NOUVEAU TEST: ISBN duplicate
    test('devrait refuser un livre avec ISBN existant', async () => {
      // Créer un livre avec ISBN
      await Book.create(createTestBook({
        title: 'Premier livre',
        identifiers: [{ type: 'ISBN_13', identifier: '9781234567890' }],
        library: { ...createTestBook().library, librarian: 'test' }
      }));

      const duplicateData = {
        title: 'Deuxième livre',
        authors: ['Autre auteur'],
        isbn: '9781234567890',
        location: 'B-1',
        librarian: 'test'
      };

      const response = await request(app)
        .post('/api/books')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/ISBN/i);
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
      const fakeId = '507f1f77bcf86cd799439011'; // ObjectId valide mais inexistant

      const response = await request(app)
        .get(`/api/books/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      
      console.log('✅ GET /api/books/:id (404) OK');
    });

    // ✅ NOUVEAU TEST: ID invalide
    test('devrait retourner 500 pour ID invalide', async () => {
      const response = await request(app)
        .get('/api/books/invalid-id')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  // ✅ NOUVEAUX TESTS pour améliorer la couverture
  describe('PUT /api/books/:id', () => {
    test('devrait modifier un livre existant', async () => {
      const book = await Book.create(createTestBook({
        title: 'Titre Original',
        library: { ...createTestBook().library, librarian: 'test' }
      }));

      const updateData = {
        title: 'Titre Modifié',
        status: 'borrowed'
      };

      const response = await request(app)
        .put(`/api/books/${book._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Titre Modifié');
      expect(response.body.data.status).toBe('borrowed');
    });
  });

  describe('DELETE /api/books/:id', () => {
    test('devrait supprimer un livre disponible', async () => {
      const book = await Book.create(createTestBook({
        title: 'Livre à supprimer',
        status: 'available',
        library: { ...createTestBook().library, librarian: 'test' }
      }));

      const response = await request(app)
        .delete(`/api/books/${book._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Vérifier que le livre est supprimé
      const deletedBook = await Book.findById(book._id);
      expect(deletedBook).toBeNull();
    });

    test('devrait refuser de supprimer un livre emprunté', async () => {
      const book = await Book.create(createTestBook({
        title: 'Livre emprunté',
        status: 'borrowed',
        library: { ...createTestBook().library, librarian: 'test' }
      }));

      const response = await request(app)
        .delete(`/api/books/${book._id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/emprunté/i);
    });
  });

  describe('GET /api/books/stats', () => {
    test('devrait retourner les statistiques', async () => {
      // Créer quelques livres de test
      await Book.create([
        createTestBook({ status: 'available', library: { ...createTestBook().library, librarian: 'test' } }),
        createTestBook({ status: 'borrowed', library: { ...createTestBook().library, librarian: 'test' } }),
        createTestBook({ status: 'damaged', library: { ...createTestBook().library, librarian: 'test' } })
      ]);

      const response = await request(app)
        .get('/api/books/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('borrowed');
      expect(response.body.data).toHaveProperty('damaged');
      expect(typeof response.body.data.total).toBe('number');
    });
  });

});