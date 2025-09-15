const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// ⚠️ ROUTES DE DÉVELOPPEMENT UNIQUEMENT
if (process.env.NODE_ENV !== 'development') {
  router.use((req, res) => {
    res.status(404).json({ error: 'Development routes not available in production' });
  });
  module.exports = router;
}

// POST /api/dev/quick-borrow - Emprunt rapide pour test
router.post('/quick-borrow', async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    
    console.log(`🧪 [DEV] Emprunt rapide: User ${userId} emprunte Book ${bookId}`);
    
    const { User, Loan } = req.app.locals.models;

    // Vérifications basiques
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      });
    }

    if (book.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: `Livre ${book.status}, pas disponible`
      });
    }

    // Créer l'emprunt
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const loan = await Loan.create({
      user_id: userId,
      book_id: bookId,
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
      due_date: dueDate
    });

    // Mettre à jour le livre
    book.status = 'borrowed';
    book.totalBorrows += 1;
    await book.save();

    console.log(`✅ [DEV] Emprunt créé: ${loan.id}`);

    res.json({
      success: true,
      message: `📚 [DEV] "${book.title}" emprunté par ${user.firstname}`,
      data: {
        loan: {
          id: loan.id,
          title: loan.book_title,
          author: loan.book_author,
          dueDate: loan.due_date,
          status: loan.status
        },
        book: book.getShortInfo()
      }
    });

  } catch (error) {
    console.error('❌ [DEV] Erreur emprunt rapide:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/dev/users - Liste des utilisateurs
router.get('/users', async (req, res) => {
  try {
    const { User } = req.app.locals.models;
    
    const users = await User.findAll({
      attributes: ['id', 'firstname', 'lastname', 'username', 'email', 'role'],
      order: [['role', 'DESC'], ['firstname', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('❌ [DEV] Erreur liste users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/dev/all-loans - Tous les emprunts
router.get('/all-loans', async (req, res) => {
  try {
    const { Loan, User } = req.app.locals.models;
    
    const loans = await Loan.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstname', 'lastname', 'username', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: loans.map(loan => ({
        id: loan.id,
        book_title: loan.book_title,
        book_author: loan.book_author,
        status: loan.status,
        borrowed_date: loan.borrowed_date,
        due_date: loan.due_date,
        renewal_count: loan.renewal_count,
        user: loan.user
      }))
    });

  } catch (error) {
    console.error('❌ [DEV] Erreur tous emprunts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/dev/force-return - Retour forcé
router.post('/force-return', async (req, res) => {
  try {
    const { loanId } = req.body;
    
    const { Loan } = req.app.locals.models;

    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Emprunt non trouvé'
      });
    }

    // Retourner le livre
    await loan.returnBook();

    // Mettre à jour le statut du livre
    const book = await Book.findById(loan.book_id);
    if (book) {
      book.status = 'available';
      await book.save();
    }

    console.log(`🔄 [DEV] Retour forcé: ${loan.book_title}`);

    res.json({
      success: true,
      message: `📚 [DEV] "${loan.book_title}" retourné`,
      data: loan
    });

  } catch (error) {
    console.error('❌ [DEV] Erreur retour forcé:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/dev/stats - Statistiques dev
router.get('/stats', async (req, res) => {
  try {
    const { User, Loan } = req.app.locals.models;
    
    const [
      totalUsers,
      totalBooks,
      totalLoans,
      activeLoans,
      overdueLoans
    ] = await Promise.all([
      User.count(),
      Book.countDocuments(),
      Loan.count(),
      Loan.count({ where: { status: ['active', 'renewed'] } }),
      Loan.count({ 
        where: { 
          status: ['active', 'renewed'],
          due_date: { [require('sequelize').Op.lt]: new Date() }
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        books: totalBooks,
        loans: {
          total: totalLoans,
          active: activeLoans,
          overdue: overdueLoans
        }
      }
    });

  } catch (error) {
    console.error('❌ [DEV] Erreur stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;