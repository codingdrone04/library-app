export { COLORS } from './colors';
export { SPACING, FONT_SIZES, FONT_WEIGHTS } from './spacing';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api', // Développement
  // BASE_URL: 'https://your-backend.herokuapp.com/api', // Production
  TIMEOUT: 10000,
  
  // Endpoints
  ENDPOINTS: {
    // Livres
    BOOKS: '/books',
    BOOKS_POPULAR: '/books/popular',
    BOOKS_RECENT: '/books/recent',
    BOOKS_STATS: '/books/stats',
    BOOKS_SEARCH: '/books/search/suggestions',
    
    // Auth (futur)
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    
    // Emprunts (futur)
    LOANS: '/loans',
    USER_LOANS: '/loans/user',
  }
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Library Management',
  VERSION: '1.0.0',
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
};

// Book Status
export const BOOK_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  RESERVED: 'reserved',
  DAMAGED: 'damaged',
  LOST: 'lost',
};

// Loan Status
export const LOAN_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  RENEWED: 'renewed',
};

// Navigation Routes
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main App
  BOOK_LIST: 'BookList',
  BOOK_DETAIL: 'BookDetail',
  SEARCH: 'Search',
  PROFILE: 'Profile',
  BORROWED_BOOKS: 'BorrowedBooks',
  SCAN: 'Scan',
  
  // Librarian
  ADMIN_DASHBOARD: 'AdminDashboard',
  MANAGE_BOOKS: 'ManageBooks',
  MANAGE_USERS: 'ManageUsers',
  LOAN_MANAGEMENT: 'LoanManagement',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@library_user_token',
  USER_DATA: '@library_user_data',
  THEME: '@library_theme',
  LANGUAGE: '@library_language',
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  AGE_MIN: 13,
  AGE_MAX: 120,
};