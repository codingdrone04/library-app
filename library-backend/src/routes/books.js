const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const googleBooksService = require('../services/googleBooksService');

// ===== ROUTES PUBLIQUES (lecture) =====

// GET /api/books - Obtenir tous les livres avec filtres
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      author,
      search,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Construction de la requête
    let query = {};
    
    // Filtres
    if (status) query.status = status;
    if (category) query.categories = { $in: [category] };
    if (author) query.authors = { $regex: author, $options: 'i' };
    
    // Recherche textuelle
    let books;
    if (search) {
      books = await Book.searchBooks(search, query);
    } else {
      // Tri
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      books = await Book.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
    }

    // Compter le total pour la pagination
    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET /books:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des livres',
      message: error.message
    });
  }
});

// GET /api/books/popular - Livres populaires
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const books = await Book.getPopular(parseInt(limit));
    
    res.json({
      success: true,
      data: books,
      count: books.length
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/popular:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des livres populaires'
    });
  }
});

// GET /api/books/recent - Livres récents
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const books = await Book.getRecent(parseInt(limit));
    
    res.json({
      success: true,
      data: books,
      count: books.length
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/recent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des nouveautés'
    });
  }
});

// GET /api/books/stats - Statistiques de la bibliothèque
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: 'available' }),
      Book.countDocuments({ status: 'borrowed' }),
      Book.countDocuments({ status: 'reserved' }),
      Book.countDocuments({ status: 'damaged' }),
      Book.countDocuments({ isEnriched: true })
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0],
        available: stats[1],
        borrowed: stats[2],
        reserved: stats[3],
        damaged: stats[4],
        enriched: stats[5],
        enrichmentRate: stats[0] > 0 ? Math.round((stats[5] / stats[0]) * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/books/search/suggestions - Suggestions d'autocomplétion
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Requête trop courte'
      });
    }

    // Recherche dans notre DB d'abord
    const localBooks = await Book.searchBooks(q, {}).limit(3);
    
    // Puis suggestions Google Books
    const googleSuggestions = await googleBooksService.getSearchSuggestions(q, 3);
    
    res.json({
      success: true,
      data: {
        local: localBooks.map(book => ({
          title: book.title,
          author: book.author,
          suggestion: `${book.title} - ${book.author}`,
          inLibrary: true,
          book: book.getShortInfo()
        })),
        external: googleSuggestions.map(item => ({
          ...item,
          inLibrary: false
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/search/suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des suggestions'
    });
  }
});

// GET /api/books/:id - Obtenir un livre par ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      });
    }

    // Obtenir des livres similaires
    const similarBooks = await googleBooksService.findSimilarBooks(book, 3);

    res.json({
      success: true,
      data: {
        book,
        similarBooks
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du livre'
    });
  }
});

// ===== ROUTES ADMINISTRATEUR (écriture) =====
// TODO: Ajouter middleware d'authentification

// POST /api/books - Ajouter un nouveau livre
router.post('/', async (req, res) => {
  try {
    const {
      title,
      authors,
      isbn,
      location,
      condition = 'good',
      price,
      notes,
      librarian = 'admin' // TODO: Récupérer depuis le token JWT
    } = req.body;

    // Validation de base
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Le titre est requis'
      });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'La localisation est requise'
      });
    }

    // Vérifier si le livre existe déjà (par ISBN)
    if (isbn) {
      const existingBook = await Book.findByISBN(isbn);
      if (existingBook) {
        return res.status(409).json({
          success: false,
          error: 'Un livre avec cet ISBN existe déjà',
          existingBook: existingBook.getShortInfo()
        });
      }
    }

    // Données de base du livre
    let bookData = {
      title: title.trim(),
      authors: Array.isArray(authors) ? authors : [authors || 'Auteur inconnu'],
      library: {
        location,
        condition,
        price: price ? parseFloat(price) : undefined,
        notes: notes || '',
        librarian
      }
    };

    // Enrichissement avec Google Books
    let enrichedData = null;
    
    try {
      console.log('🔍 Tentative d\'enrichissement avec Google Books...');
      
      if (isbn) {
        // Recherche par ISBN
        enrichedData = await googleBooksService.searchByISBN(isbn);
      } else if (title && authors) {
        // Recherche par titre + auteur
        const searchQuery = `${title} ${Array.isArray(authors) ? authors[0] : authors}`;
        const results = await googleBooksService.searchBooks(searchQuery, 1);
        if (results.length > 0) {
          enrichedData = results[0];
        }
      }

      if (enrichedData) {
        console.log('✅ Livre enrichi avec Google Books');
        
        // Fusionner les données
        bookData = {
          ...bookData,
          ...enrichedData,
          // Garder les données locales prioritaires
          library: bookData.library,
          status: 'available'
        };
      } else {
        console.log('⚠️ Pas d\'enrichissement trouvé');
      }
      
    } catch (enrichError) {
      console.warn('⚠️ Erreur enrichissement (continuons sans):', enrichError.message);
    }

    // Créer le livre
    const book = new Book(bookData);
    await book.save();

    console.log(`📚 Nouveau livre ajouté: ${book.title}`);

    res.status(201).json({
      success: true,
      data: book,
      message: `Livre "${book.title}" ajouté avec succès`,
      enriched: !!enrichedData
    });

  } catch (error) {
    console.error('❌ Erreur POST /books:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du livre'
    });
  }
});

// PUT /api/books/:id - Modifier un livre
router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      });
    }

    // Mettre à jour les champs autorisés
    const allowedUpdates = [
      'title', 'subtitle', 'authors', 'description', 'categories', 
      'genre', 'publisher', 'publishedDate', 'pageCount', 'cover',
      'status', 'library.location', 'library.condition', 'library.price', 
      'library.notes', 'tags'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.includes('.')) {
          // Gestion des champs imbriqués (library.*)
          const [parent, child] = field.split('.');
          if (!updates[parent]) updates[parent] = {};
          updates[parent][child] = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Appliquer les mises à jour
    Object.assign(book, updates);
    
    if (updates.library) {
      Object.assign(book.library, updates.library);
    }

    await book.save();

    console.log(`📝 Livre modifié: ${book.title}`);

    res.json({
      success: true,
      data: book,
      message: 'Livre modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur PUT /books/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du livre'
    });
  }
});

// DELETE /api/books/:id - Supprimer un livre
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      });
    }

    // Vérifier que le livre n'est pas emprunté
    if (book.status === 'borrowed') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un livre emprunté'
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Livre supprimé: ${book.title}`);

    res.json({
      success: true,
      message: `Livre "${book.title}" supprimé avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur DELETE /books/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du livre'
    });
  }
});

// POST /api/books/:id/enrich - Re-enrichir un livre avec Google Books
router.post('/:id/enrich', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      });
    }

    // Tentative d'enrichissement
    let enrichedData = null;
    
    if (book.isbn) {
      enrichedData = await googleBooksService.searchByISBN(book.isbn);
    } else {
      const searchQuery = `${book.title} ${book.author}`;
      const results = await googleBooksService.searchBooks(searchQuery, 1);
      if (results.length > 0) {
        enrichedData = results[0];
      }
    }

    if (enrichedData) {
      // Fusionner sans écraser les données locales importantes
      Object.assign(book, {
        subtitle: enrichedData.subtitle || book.subtitle,
        description: enrichedData.description || book.description,
        categories: enrichedData.categories || book.categories,
        genre: enrichedData.genre || book.genre,
        publisher: enrichedData.publisher || book.publisher,
        publishedDate: enrichedData.publishedDate || book.publishedDate,
        pageCount: enrichedData.pageCount || book.pageCount,
        cover: enrichedData.cover || book.cover,
        googleBooks: enrichedData.googleBooks,
        identifiers: enrichedData.identifiers || book.identifiers
      });

      await book.markAsEnriched();

      res.json({
        success: true,
        data: book,
        message: 'Livre enrichi avec succès'
      });
    } else {
      res.json({
        success: false,
        message: 'Aucune donnée d\'enrichissement trouvée'
      });
    }

  } catch (error) {
    console.error('❌ Erreur POST /books/:id/enrich:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enrichissement du livre'
    });
  }
});

// GET /api/books/stats - Statistiques de la bibliothèque
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: 'available' }),
      Book.countDocuments({ status: 'borrowed' }),
      Book.countDocuments({ status: 'reserved' }),
      Book.countDocuments({ status: 'damaged' }),
      Book.countDocuments({ isEnriched: true })
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0],
        available: stats[1],
        borrowed: stats[2],
        reserved: stats[3],
        damaged: stats[4],
        enriched: stats[5],
        enrichmentRate: stats[0] > 0 ? Math.round((stats[5] / stats[0]) * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET /books/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;