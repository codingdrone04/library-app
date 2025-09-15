const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../src/models/Book');
const { createTestBook } = require('../helpers/testData');

describe('Book Model avec MongoDB Memory Server', () => {
  let mongod;

  beforeAll(async () => {
    console.log('🚀 Démarrage MongoDB Memory Server pour Book tests...');
    
    try {

      mongod = await MongoMemoryServer.create({
        binary: {
          version: '6.0.9',
          downloadDir: './node_modules/.cache/mongodb-memory-server',
        },
        instance: {
          storageEngine: 'wiredTiger',
          dbName: 'library-book-test',
        },
      });

      const mongoUri = mongod.getUri();
      console.log('📊 MongoDB Memory Server URI:', mongoUri);

      await mongoose.connect(mongoUri);
      
      console.log('✅ MongoDB Memory Server connecté!');
      console.log('📡 ReadyState:', mongoose.connection.readyState);
      
      await Book.deleteMany({ 'library.librarian': 'test' });
      console.log('🧹 Livres de test nettoyés');
      
    } catch (error) {
      console.error('❌ Erreur setup MongoDB Memory Server:', error.message);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    console.log('🧹 Nettoyage final Book tests...');
    
    try {
      await Book.deleteMany({ 'library.librarian': 'test' });
      
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      if (mongod) {
        await mongod.stop();
      }
      
      console.log('✅ Livres de test supprimés et connexion fermée');
    } catch (error) {
      console.error('❌ Erreur nettoyage Book tests:', error);
    }
  }, 10000);

  afterEach(async () => {
    await Book.deleteMany({ 'library.librarian': 'test' });
  });

  test('devrait créer et sauvegarder un livre', async () => {
    console.log('🧪 Test création livre...');
    
    expect(mongoose.connection.readyState).toBe(1);
    
    const bookData = createTestBook({
      library: {
        location: 'TEST-A1',
        condition: 'good',
        librarian: 'test'
      }
    });
    
    const book = new Book(bookData);
    const savedBook = await book.save();
    
    expect(savedBook._id).toBeDefined();
    expect(savedBook.title).toBe('Livre de Test');
    expect(savedBook.status).toBe('available');
    
    console.log('✅ Livre sauvé ID:', savedBook._id.toString());
  });

  test('devrait refuser un livre sans titre', async () => {
    const bookData = createTestBook({ 
      title: undefined,
      library: { ...createTestBook().library, librarian: 'test' }
    });
    const book = new Book(bookData);
    
    await expect(book.save()).rejects.toThrow();
    console.log('✅ Validation titre OK');
  });

  test('devrait pouvoir chercher par statut', async () => {
    await Book.create([
      createTestBook({ 
        title: 'Livre Disponible', 
        status: 'available',
        library: { ...createTestBook().library, librarian: 'test' }
      }),
      createTestBook({ 
        title: 'Livre Emprunté', 
        status: 'borrowed',
        library: { ...createTestBook().library, librarian: 'test' }
      })
    ]);

    const availableBooks = await Book.find({ 
      status: 'available', 
      'library.librarian': 'test' 
    });
    const borrowedBooks = await Book.find({ 
      status: 'borrowed', 
      'library.librarian': 'test' 
    });

    expect(availableBooks.length).toBe(1);
    expect(borrowedBooks.length).toBe(1);
    expect(availableBooks[0].title).toBe('Livre Disponible');
    
    console.log('✅ Recherche par statut OK');
  });

  test('méthodes virtuelles fonctionnent', async () => {
    const book = new Book(createTestBook({
      authors: ['Premier Auteur', 'Deuxième Auteur'],
      library: { ...createTestBook().library, librarian: 'test' }
    }));
    
    const saved = await book.save();
    
    expect(saved.author).toBe('Premier Auteur');
    expect(saved.isAvailable()).toBe(true);
    
    console.log('✅ Méthodes virtuelles OK');
  });

  test('devrait valider les données requises', async () => {
    const invalidBook = new Book({
      authors: ['Test Author']
    });
    
    await expect(invalidBook.save()).rejects.toThrow();
    console.log('✅ Validation données requises OK');
  });

  test('devrait créer des méthodes statiques', async () => {
    await Book.create([
      createTestBook({ 
        title: 'Available Book 1',
        status: 'available',
        library: { ...createTestBook().library, librarian: 'test' }
      }),
      createTestBook({ 
        title: 'Available Book 2',
        status: 'available', 
        library: { ...createTestBook().library, librarian: 'test' }
      }),
      createTestBook({ 
        title: 'Borrowed Book',
        status: 'borrowed',
        library: { ...createTestBook().library, librarian: 'test' }
      })
    ]);

    const availableBooks = await Book.getByStatus('available');
    const filteredTestBooks = availableBooks.filter(book => 
      book.library.librarian === 'test'
    );
    
    expect(filteredTestBooks.length).toBe(2);
    console.log('✅ Méthodes statiques OK');
  });
});