const mongoose = require('mongoose');

// Schéma pour les identifiants (ISBN, etc.)
const identifierSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ISBN_10', 'ISBN_13', 'ISSN', 'OTHER'],
    required: true
  },
  identifier: {
    type: String,
    required: true
  }
}, { _id: false });

// Schéma pour les informations de bibliothèque
const libraryInfoSchema = new mongoose.Schema({
  library_id: {
    type: Number,
    required: true,
    index: true // Référence vers PostgreSQL libraries.id
  },
  location: {
    type: String,
    required: true,
    index: true // Pour recherche rapide par localisation
  },
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  price: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  librarian: {
    type: String, // ID du bibliothécaire qui a ajouté le livre
    required: true
  }
}, { _id: false });

// Schéma pour les données Google Books enrichies
const googleBooksSchema = new mongoose.Schema({
  googleBooksId: {
    type: String,
    index: true
  },
  previewLink: String,
  infoLink: String,
  canonicalVolumeLink: String,
  averageRating: {
    type: Number,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    min: 0
  },
  maturityRating: String,
  allowAnonLogging: Boolean,
  contentVersion: String,
  imageLinks: {
    smallThumbnail: String,
    thumbnail: String,
    small: String,
    medium: String,
    large: String,
    extraLarge: String
  }
}, { _id: false });

// Schéma principal du livre
const bookSchema = new mongoose.Schema({
  // === DONNÉES ESSENTIELLES ===
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    index: 'text' // Index de recherche textuelle
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 500
  },
  authors: [{
    type: String,
    trim: true,
    index: 'text' // Index de recherche textuelle
  }],
  
  // === MÉTADONNÉES ===
  description: {
    type: String,
    maxlength: 5000
  },
  categories: [{
    type: String,
    trim: true,
    index: true
  }],
  genre: {
    type: String,
    trim: true,
    index: true
  },
  language: {
    type: String,
    default: 'fr',
    index: true
  },
  
  // === PUBLICATION ===
  publisher: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: String // Garde en String car Google Books renvoie parfois juste l'année
  },
  pageCount: {
    type: Number,
    min: 0
  },
  
  // === IDENTIFIANTS ===
  identifiers: [identifierSchema],
  
  // === IMAGES ===
  cover: {
    type: String, // URL principale de la couverture
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Cover must be a valid URL'
    }
  },
  
  // === STATUT BIBLIOTHÈQUE ===
  status: {
    type: String,
    enum: ['available', 'borrowed', 'reserved', 'damaged', 'lost', 'maintenance'],
    default: 'available',
    required: true,
    index: true
  },
  
  // === INFORMATIONS BIBLIOTHÈQUE ===
  library: {
    type: libraryInfoSchema,
    required: true
  },
  
  // === DONNÉES GOOGLE BOOKS ===
  googleBooks: googleBooksSchema,
  
  // === MÉTADONNÉES SYSTÈME ===
  isEnriched: {
    type: Boolean,
    default: false // True si enrichi avec Google Books
  },
  lastEnrichmentDate: Date,
  
  // === STATISTIQUES ===
  totalBorrows: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // === TAGS PERSONNALISÉS ===
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  collection: 'books'
});

// === INDEX COMPOSÉS ===
bookSchema.index({ title: 'text', 'authors': 'text', description: 'text' });
bookSchema.index({ status: 1, 'library.location': 1 });
bookSchema.index({ 'library.library_id': 1, status: 1 }); // Index pour filtrage par bibliothèque
bookSchema.index({ categories: 1, status: 1 });
bookSchema.index({ 'identifiers.identifier': 1 });

// === MÉTHODES VIRTUELLES ===
// Auteur principal (premier de la liste)
bookSchema.virtual('author').get(function() {
  return this.authors && this.authors.length > 0 ? this.authors[0] : 'Auteur inconnu';
});

// URL de couverture avec fallback
bookSchema.virtual('coverUrl').get(function() {
  return this.cover || 
         this.googleBooks?.imageLinks?.thumbnail ||
         this.googleBooks?.imageLinks?.smallThumbnail ||
         null;
});

// ISBN principal (préfère ISBN-13, puis ISBN-10)
bookSchema.virtual('isbn').get(function() {
  if (!this.identifiers || this.identifiers.length === 0) return null;
  
  const isbn13 = this.identifiers.find(id => id.type === 'ISBN_13');
  if (isbn13) return isbn13.identifier;
  
  const isbn10 = this.identifiers.find(id => id.type === 'ISBN_10');
  if (isbn10) return isbn10.identifier;
  
  return this.identifiers[0].identifier;
});

// === MÉTHODES D'INSTANCE ===
// Vérifier si le livre est disponible
bookSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Obtenir les informations de format court
bookSchema.methods.getShortInfo = function() {
  return {
    id: this._id,
    title: this.title,
    author: this.author,
    cover: this.coverUrl,
    status: this.status,
    location: this.library.location
  };
};

// Marquer comme enrichi
bookSchema.methods.markAsEnriched = function() {
  this.isEnriched = true;
  this.lastEnrichmentDate = new Date();
  return this.save();
};

// === MÉTHODES STATIQUES ===
// Recherche textuelle avancée
bookSchema.statics.searchBooks = function(query, filters = {}) {
  console.log('🔍 Book.searchBooks appelée avec:', { query, filters });
  
  // Essayer d'abord la recherche textuelle MongoDB
  const searchQuery = {
    $text: { $search: query }
  };
  
  // Ajouter des filtres
  if (filters.status) searchQuery.status = filters.status;
  if (filters.categories) searchQuery.categories = { $in: filters.categories };
  if (filters.authors) searchQuery.authors = { $in: filters.authors };
  if (filters.language) searchQuery.language = filters.language;

  console.log('📝 Requête MongoDB générée:', JSON.stringify(searchQuery, null, 2));

  return this.find(searchQuery, { score: { $meta: 'textScore' } })
             .sort({ score: { $meta: 'textScore' } })
             .then(results => {
               console.log('✅ Résultats recherche textuelle:', results.length);
               
               // Si pas de résultats avec recherche textuelle, essayer regex
               if (results.length === 0) {
                 console.log('🔄 Recherche textuelle vide, essai avec regex...');
                 return this.find({
                   $or: [
                     { title: { $regex: query, $options: 'i' } },
                     { authors: { $regex: query, $options: 'i' } },
                     { description: { $regex: query, $options: 'i' } }
                   ],
                   ...filters
                 });
               }
               
               return results;
             })
             .catch(error => {
               console.error('❌ Erreur recherche textuelle, fallback regex:', error);
               
               // Fallback avec regex si l'index textuel n'existe pas
               return this.find({
                 $or: [
                   { title: { $regex: query, $options: 'i' } },
                   { authors: { $regex: query, $options: 'i' } },
                   { description: { $regex: query, $options: 'i' } }
                 ],
                 ...filters
               });
             });
};

// ===== CRÉATION D'INDEX (à ajouter après le schéma) =====

// Créer l'index textuel si pas encore fait
bookSchema.index({ 
  title: 'text', 
  'authors': 'text', 
  description: 'text',
  categories: 'text'
}, {
  weights: {
    title: 10,
    authors: 5,
    categories: 3,
    description: 1
  },
  name: 'book_text_search'
});

// Trouver par ISBN
bookSchema.statics.findByISBN = function(isbn) {
  return this.findOne({
    'identifiers.identifier': isbn
  });
};

// Obtenir livres par statut
bookSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ 'library.acquisitionDate': -1 });
};

// Livres populaires (les plus empruntés)
bookSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'available' })
             .sort({ totalBorrows: -1 })
             .limit(limit);
};

// Nouveautés (récemment acquis)
bookSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: 'available' })
             .sort({ 'library.acquisitionDate': -1 })
             .limit(limit);
};

// === MIDDLEWARE PRE-SAVE ===
bookSchema.pre('save', function(next) {
  // Nettoyer les données
  if (this.title) this.title = this.title.trim();
  if (this.authors) {
    this.authors = this.authors.map(author => author.trim()).filter(Boolean);
  }
  
  // S'assurer qu'on a au moins un auteur
  if (!this.authors || this.authors.length === 0) {
    this.authors = ['Auteur inconnu'];
  }
  
  // Définir le genre principal basé sur les catégories
  if (!this.genre && this.categories && this.categories.length > 0) {
    this.genre = this.categories[0];
  }
  
  next();
});

// === MIDDLEWARE POST-SAVE ===
bookSchema.post('save', function() {
  console.log(`📚 Livre sauvegardé: ${this.title} by ${this.author}`);
});

// Assurer que les champs virtuels sont inclus dans JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;