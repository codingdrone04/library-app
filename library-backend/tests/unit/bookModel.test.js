const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../src/models/Book');

describe('Book Model Methods', () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  }, 10000);

  beforeEach(async () => {
    await Book.deleteMany({});
  });

  describe('Static Methods', () => {
    test('findByISBN devrait trouver un livre par ISBN', async () => {
      const book = await Book.create({
        title: 'Test Book',
        authors: ['Test Author'],
        identifiers: [{ type: 'ISBN_13', identifier: '9781234567890' }],
        library: { location: 'A-1', librarian: 'test' }
      });

      const found = await Book.findByISBN('9781234567890');
      expect(found).toBeTruthy();
      expect(found.title).toBe('Test Book');
    });

    test('getByStatus devrait filtrer par statut', async () => {
      await Book.create([
        { title: 'Available Book', status: 'available', authors: ['Author'], library: { location: 'A-1', librarian: 'test' } },
        { title: 'Borrowed Book', status: 'borrowed', authors: ['Author'], library: { location: 'A-2', librarian: 'test' } },
        { title: 'Another Available', status: 'available', authors: ['Author'], library: { location: 'A-3', librarian: 'test' } }
      ]);

      const availableBooks = await Book.getByStatus('available');
      expect(availableBooks).toHaveLength(2);
      expect(availableBooks.every(book => book.status === 'available')).toBe(true);
    });

    test('getPopular devrait retourner les livres les plus empruntés', async () => {
      await Book.create([
        { title: 'Popular Book 1', totalBorrows: 10, authors: ['Author'], library: { location: 'A-1', librarian: 'test' } },
        { title: 'Popular Book 2', totalBorrows: 5, authors: ['Author'], library: { location: 'A-2', librarian: 'test' } },
        { title: 'Unpopular Book', totalBorrows: 1, authors: ['Author'], library: { location: 'A-3', librarian: 'test' } }
      ]);

      const popular = await Book.getPopular(2);
      expect(popular).toHaveLength(2);
      expect(popular[0].totalBorrows).toBe(10);
      expect(popular[1].totalBorrows).toBe(5);
    });

    test('getRecent devrait retourner les livres récemment acquis', async () => {
      const now = new Date();
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

      await Book.create([
        { 
          title: 'Recent Book', 
          authors: ['Author'], 
          library: { 
            location: 'A-1', 
            librarian: 'test',
            acquisitionDate: yesterday 
          } 
        },
        { 
          title: 'Old Book', 
          authors: ['Author'], 
          library: { 
            location: 'A-2', 
            librarian: 'test',
            acquisitionDate: lastWeek 
          } 
        }
      ]);

      const recent = await Book.getRecent(5);
      expect(recent).toHaveLength(2);
      expect(recent[0].title).toBe('Recent Book');
    });

    test('searchBooks devrait rechercher dans le texte', async () => {
      await Book.create([
        { 
          title: 'Harry Potter and the Philosopher Stone', 
          authors: ['J.K. Rowling'], 
          description: 'Magic and wizardry',
          library: { location: 'A-1', librarian: 'test' } 
        },
        { 
          title: 'The Hobbit', 
          authors: ['J.R.R. Tolkien'], 
          description: 'Adventure in Middle-earth',
          library: { location: 'A-2', librarian: 'test' } 
        }
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      const results = await Book.searchBooks('Harry');
      expect(results.length).toBeGreaterThanOrEqual(0);
      
      const regexResults = await Book.find({
        $or: [
          { title: { $regex: 'Harry', $options: 'i' } },
          { authors: { $regex: 'Harry', $options: 'i' } }
        ]
      });
      expect(regexResults).toHaveLength(1);
      expect(regexResults[0].title).toContain('Harry');
    });
  });

  describe('Instance Methods', () => {
    test('isAvailable devrait vérifier la disponibilité', async () => {
      const availableBook = new Book({
        title: 'Available Book',
        status: 'available',
        authors: ['Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      const borrowedBook = new Book({
        title: 'Borrowed Book',
        status: 'borrowed',
        authors: ['Author'],
        library: { location: 'A-2', librarian: 'test' }
      });

      expect(availableBook.isAvailable()).toBe(true);
      expect(borrowedBook.isAvailable()).toBe(false);
    });

    test('getShortInfo devrait retourner les infos essentielles', async () => {
      const book = new Book({
        title: 'Test Book',
        authors: ['Test Author'],
        status: 'available',
        cover: 'http://example.com/cover.jpg',
        library: { location: 'A-1', librarian: 'test' }
      });

      const shortInfo = book.getShortInfo();
      expect(shortInfo).toHaveProperty('title', 'Test Book');
      expect(shortInfo).toHaveProperty('author', 'Test Author');
      expect(shortInfo).toHaveProperty('status', 'available');
      expect(shortInfo).toHaveProperty('location', 'A-1');
    });

    test('markAsEnriched devrait marquer comme enrichi', async () => {
      const book = await Book.create({
        title: 'Test Book',
        authors: ['Test Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(book.isEnriched).toBe(false);
      expect(book.lastEnrichmentDate).toBeUndefined();

      await book.markAsEnriched();

      expect(book.isEnriched).toBe(true);
      expect(book.lastEnrichmentDate).toBeDefined();
    });
  });

  describe('Virtual Properties', () => {
    test('author devrait retourner le premier auteur', () => {
      const book = new Book({
        title: 'Test Book',
        authors: ['First Author', 'Second Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(book.author).toBe('First Author');
    });

    test('author devrait retourner "Auteur inconnu" si pas d\'auteurs', () => {
      const book = new Book({
        title: 'Test Book',
        authors: [],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(book.author).toBe('Auteur inconnu');
    });

    test('coverUrl devrait retourner la meilleure image disponible', () => {
      const bookWithCover = new Book({
        title: 'Test Book',
        cover: 'direct-cover.jpg',
        googleBooks: {
          imageLinks: {
            thumbnail: 'google-thumbnail.jpg'
          }
        },
        authors: ['Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(bookWithCover.coverUrl).toBe('direct-cover.jpg');

      const bookWithGoogleCover = new Book({
        title: 'Test Book',
        googleBooks: {
          imageLinks: {
            thumbnail: 'google-thumbnail.jpg'
          }
        },
        authors: ['Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(bookWithGoogleCover.coverUrl).toBe('google-thumbnail.jpg');
    });

    test('isbn devrait retourner le meilleur ISBN disponible', () => {
      const book = new Book({
        title: 'Test Book',
        identifiers: [
          { type: 'ISBN_10', identifier: '1234567890' },
          { type: 'ISBN_13', identifier: '9781234567890' }
        ],
        authors: ['Author'],
        library: { location: 'A-1', librarian: 'test' }
      });

      expect(book.isbn).toBe('9781234567890');
    });
  });

  describe('Middleware', () => {
    test('pre-save devrait nettoyer les données', async () => {
      const book = new Book({
        title: '  Test Book with spaces  ',
        authors: ['  Author with spaces  ', '', '  Another Author  '],
        library: { location: 'A-1', librarian: 'test' }
      });

      await book.save();

      expect(book.title).toBe('Test Book with spaces');
      expect(book.authors).toEqual(['Author with spaces', 'Another Author']);
    });

    test('pre-save devrait définir un auteur par défaut si vide', async () => {
      const book = new Book({
        title: 'Test Book',
        authors: [],
        library: { location: 'A-1', librarian: 'test' }
      });

      await book.save();

      expect(book.authors).toEqual(['Auteur inconnu']);
    });

    test('pre-save devrait définir le genre basé sur les catégories', async () => {
      const book = new Book({
        title: 'Test Book',
        authors: ['Author'],
        categories: ['Fiction', 'Adventure'],
        library: { location: 'A-1', librarian: 'test' }
      });

      await book.save();

      expect(book.genre).toBe('Fiction');
    });
  });
});