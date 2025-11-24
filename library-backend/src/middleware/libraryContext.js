const jwt = require('jsonwebtoken');

/**
 * Middleware pour injecter le contexte de bibliothèque dans la requête
 * Récupère le library_id depuis l'utilisateur authentifié
 */
const libraryContext = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // Pas de token = pas de contexte bibliothèque
      // Laisser passer pour les routes publiques
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = req.app.locals.models;

    const user = await User.findByPk(decoded.userId, {
      include: [{
        association: 'library',
        attributes: ['id', 'name', 'code', 'settings', 'is_active']
      }]
    });

    if (user && user.library) {
      // Injecter le library_id et les infos de la bibliothèque dans la requête
      req.library_id = user.library_id;
      req.library = user.library;
      req.library_settings = user.library.settings || {};
    }

    next();
  } catch (error) {
    // En cas d'erreur de token, laisser passer (l'auth middleware gérera)
    next();
  }
};

/**
 * Middleware pour forcer la présence d'un contexte bibliothèque
 * À utiliser sur les routes qui nécessitent absolument un library_id
 */
const requireLibraryContext = (req, res, next) => {
  if (!req.library_id) {
    return res.status(403).json({
      success: false,
      error: 'Contexte bibliothèque requis. Veuillez vous authentifier.'
    });
  }
  next();
};

module.exports = {
  libraryContext,
  requireLibraryContext
};
