const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Book = require('../../src/models/Book');
const { createTestBook } = require('../helpers/testData');
const connectMongoDB = require('../../src/config/mongodb');

describe('Book Model avec MongoDB Atlas', () => {

  beforeAll(async () => {
    console.log('🚀 Connexion à MongoDB Atlas (tests)...');
    console.log('🔑 MONGODB_URI présent:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non défini dans les variables d\'environnement');
      throw new Error('MONGODB_URI requis pour les tests');
    }
    
    console.log('🔗 URI (masqué):', process.env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@'));
    
    try {
      await connectMongoDB();
      
      console.log('✅ MongoDB Atlas connecté!');
      console.log('📡 ReadyState:', mongoose.connection.readyState);
      console.log('🏠 Host:', mongoose.connection.host);
      
      await Book.deleteMany({ 'library.librarian': 'test' });
      console.log('🧹 Livres de test nettoyés');
      
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB Atlas:', error.message);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    console.log('🧹 Nettoyage final...');
    
    try {
      await Book.deleteMany({ 'library.librarian': 'test' });
      await mongoose.connection.close();
      console.log('✅ Livres de test supprimés et connexion fermée');
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
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
    // Créer 2 livres avec statuts différents
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

    // Chercher seulement dans les livres de test
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
    
    expect(saved.author).toBe('Premier Auteur'); // Virtual field
    expect(saved.isAvailable()).toBe(true); // Instance method
    
    console.log('✅ Méthodes virtuelles OK');
  });

});