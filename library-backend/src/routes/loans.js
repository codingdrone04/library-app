const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// GET /api/loans - Tous les emprunts actifs
router.get('/', async (req, res) => {
  try {
    const { User, Loan } = req.app.locals.models;
    
    const loans = await Loan.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstname', 'lastname', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('❌ Erreur GET /loans:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des emprunts'
    });
  }
});

// GET /api/loans/user/:userId - Emprunts d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { Loan } = req.app.locals.models;
    
    const loans = await Loan.findAll({
      where: {
        user_id: userId,
        status: ['active', 'renewed']
      },
      order: [['due_date', 'ASC']]
    });

    // Enrichir avec les données des livres MongoDB
    const enrichedLoans = await Promise.all(
      loans.map(async (loan) => {
        try {
          const book = await Book.findById(loan.book_id);
          return {
            id: loan.id,
            title: loan.book_title,
            author: loan.book_author,
            isbn: loan.book_isbn,
            status: loan.status,
            borrowDate: loan.borrowed_date,
            returnDate: loan.due_date,
            renewalCount: loan.renewal_count,
            maxRenewals: loan.max_renewals,
            book: book ? book.getShortInfo() : null
          };
        } catch (bookError) {
          console.error('❌ Livre non trouvé:', loan.book_id);
          return {
            id: loan.id,
            title: loan.book_title,
            author: loan.book_author,
            status: loan.status,
            borrowDate: loan.borrowed_date,
            returnDate: loan.due_date,
            renewalCount: loan.renewal_count,
            maxRenewals: loan.max_renewals,
            book: null
          };
        }
      })
    );

    res.json({
      success: true,
      data: enrichedLoans
    });

  } catch (error) {
    console.error('❌ Erreur GET /loans/user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des emprunts utilisateur'
    });
  }
});

// POST /api/loans - Créer un emprunt
router.post('/', async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    
    if (!bookId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'ID livre et utilisateur requis'
      });
    }

    const { User, Loan } = req.app.locals.models;

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que le livre existe et est disponible
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
        error: 'Ce livre n\'est pas disponible'
      });
    }

    // Vérifier si l'utilisateur a déjà emprunté ce livre
    const existingLoan = await Loan.findOne({
      where: {
        user_id: userId,
        book_id: bookId,
        status: ['active', 'renewed']
      }
    });

    if (existingLoan) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà emprunté ce livre'
      });
    }

    // Créer l'emprunt
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 jours

    const loan = await Loan.create({
      user_id: userId,
      book_id: bookId,
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
      due_date: dueDate
    });

    // Mettre à jour le statut du livre
    book.status = 'borrowed';
    book.totalBorrows += 1;
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Livre emprunté avec succès',
      data: {
        loan,
        book: book.getShortInfo()
      }
    });

  } catch (error) {
    console.error('❌ Erreur POST /loans:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà emprunté ce livre'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'emprunt'
    });
  }
});

// PATCH /api/loans/:loanId/return - Retourner un livre
router.patch('/:loanId/return', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { userId } = req.body;
    
    const { Loan } = req.app.locals.models;

    const loan = await Loan.findOne({
      where: {
        id: loanId,
        user_id: userId,
        status: ['active', 'renewed']
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Emprunt non trouvé ou déjà retourné'
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

    res.json({
      success: true,
      message: 'Livre retourné avec succès',
      data: loan
    });

  } catch (error) {
    console.error('❌ Erreur PATCH /loans/return:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du retour du livre'
    });
  }
});

// PATCH /api/loans/:loanId/renew - Renouveler un emprunt
router.patch('/:loanId/renew', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { userId } = req.body;
    
    const { Loan } = req.app.locals.models;

    const loan = await Loan.findOne({
      where: {
        id: loanId,
        user_id: userId,
        status: ['active', 'renewed']
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Emprunt non trouvé'
      });
    }

    if (!loan.canRenew()) {
      return res.status(400).json({
        success: false,
        error: 'Ce prêt ne peut pas être renouvelé'
      });
    }

    await loan.renewLoan();

    res.json({
      success: true,
      message: 'Emprunt renouvelé avec succès',
      data: loan
    });

  } catch (error) {
    console.error('❌ Erreur PATCH /loans/renew:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du renouvellement'
    });
  }
});

module.exports = router;