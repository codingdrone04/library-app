const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const loanRoutes = require('./routes/loans');
const libraryRoutes = require('./routes/libraries');

// Import des middlewares
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { libraryContext } = require('./middleware/libraryContext');

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(rateLimiter);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  credentials: corsOrigin !== '*', // credentials ne marche pas avec origin: '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
};
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ✅ Body parsing EN PREMIER
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (AVANT libraryContext pour ne pas dépendre de la DB)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Library API is running! 📚',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Library context middleware (injecte library_id depuis le user)
app.use(libraryContext);

// API Routes (directement à la racine pour compatibilité reverse proxy)
app.use('/auth', authRoutes);
app.use('/libraries', libraryRoutes);
app.use('/books', bookRoutes);
app.use('/users', userRoutes);
app.use('/loans', loanRoutes);

// ✅ Routes dev APRÈS le body parsing
if (process.env.NODE_ENV === 'development') {
  const devRoutes = require('./routes/dev');
  app.use('/dev', devRoutes);
}

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: '📚 Library Management API',
    version: '1.0.0',
    docs: '/docs',
    endpoints: {
      auth: '/auth',
      libraries: '/libraries',
      books: '/books',
      users: '/users',
      loans: '/loans',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/auth', '/books', '/users', '/loans', '/libraries']
  });
});

app.use(errorHandler);

module.exports = app;