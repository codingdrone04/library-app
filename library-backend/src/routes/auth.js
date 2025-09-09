const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation basique
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Récupérer le modèle User depuis la connexion
    const { User } = req.app.locals.models;
    
    // Trouver l'utilisateur
    const user = await User.findByUsernameOrEmail(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Mettre à jour la dernière connexion
    user.last_login = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstname, lastname, username, email, password, role = 'user' } = req.body;

    // Validation basique
    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    const { User } = req.app.locals.models;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByUsernameOrEmail(username) || 
                         await User.findByUsernameOrEmail(email);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Nom d\'utilisateur ou email déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const newUser = await User.create({
      firstname,
      lastname,
      username,
      email,
      password_hash: password,
      role: ['user', 'librarian', 'admin'].includes(role) ? role : 'user'
    });

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username, 
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: newUser.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur register:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/auth/me (pour vérifier le token)
router.get('/me', async (req, res) => {
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

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur me:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
});

module.exports = router;