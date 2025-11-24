const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = req.app.locals.models;

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }
  next();
};

// GET /api/libraries - Liste des bibliothèques
router.get('/', authenticate, async (req, res) => {
  try {
    const { Library } = req.app.locals.models;

    // Les admins voient toutes les bibliothèques
    // Les autres ne voient que les bibliothèques actives
    const where = req.user.role === 'admin' ? {} : { is_active: true };

    const libraries = await Library.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'address', 'city', 'phone', 'email', 'is_active', 'createdAt']
    });

    res.json({
      success: true,
      data: libraries
    });
  } catch (error) {
    console.error('❌ Erreur get libraries:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/libraries/:id - Détails d'une bibliothèque
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { Library } = req.app.locals.models;
    const { id } = req.params;

    const library = await Library.findByPk(id);

    if (!library) {
      return res.status(404).json({
        success: false,
        error: 'Bibliothèque non trouvée'
      });
    }

    // Vérifier les permissions : admin ou membre de cette bibliothèque
    if (req.user.role !== 'admin' && req.user.library_id !== library.id) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }

    res.json({
      success: true,
      data: library
    });
  } catch (error) {
    console.error('❌ Erreur get library:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST /api/libraries - Créer une bibliothèque (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { Library } = req.app.locals.models;
    const { name, code, address, city, phone, email, settings } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Nom et code requis'
      });
    }

    // Vérifier l'unicité du code
    const existingLibrary = await Library.findOne({
      where: { code: code.toUpperCase() }
    });

    if (existingLibrary) {
      return res.status(409).json({
        success: false,
        error: 'Ce code est déjà utilisé'
      });
    }

    const library = await Library.create({
      name,
      code: code.toUpperCase(),
      address,
      city,
      phone,
      email,
      settings: settings || {
        max_loans_per_user: 5,
        loan_duration_days: 14,
        max_renewals: 2,
        late_fee_per_day: 0.50
      },
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Bibliothèque créée avec succès',
      data: library
    });
  } catch (error) {
    console.error('❌ Erreur create library:', error);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors?.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// PUT /api/libraries/:id - Mettre à jour une bibliothèque (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { Library } = req.app.locals.models;
    const { id } = req.params;
    const { name, code, address, city, phone, email, settings, is_active } = req.body;

    const library = await Library.findByPk(id);

    if (!library) {
      return res.status(404).json({
        success: false,
        error: 'Bibliothèque non trouvée'
      });
    }

    // Mettre à jour les champs fournis
    if (name !== undefined) library.name = name;
    if (code !== undefined) library.code = code.toUpperCase();
    if (address !== undefined) library.address = address;
    if (city !== undefined) library.city = city;
    if (phone !== undefined) library.phone = phone;
    if (email !== undefined) library.email = email;
    if (is_active !== undefined) library.is_active = is_active;

    if (settings !== undefined) {
      library.settings = {
        ...library.settings,
        ...settings
      };
    }

    await library.save();

    res.json({
      success: true,
      message: 'Bibliothèque mise à jour',
      data: library
    });
  } catch (error) {
    console.error('❌ Erreur update library:', error);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors?.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// DELETE /api/libraries/:id - Désactiver une bibliothèque (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { Library } = req.app.locals.models;
    const { id } = req.params;

    const library = await Library.findByPk(id);

    if (!library) {
      return res.status(404).json({
        success: false,
        error: 'Bibliothèque non trouvée'
      });
    }

    // Ne pas supprimer, juste désactiver
    library.is_active = false;
    await library.save();

    res.json({
      success: true,
      message: 'Bibliothèque désactivée'
    });
  } catch (error) {
    console.error('❌ Erreur delete library:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
