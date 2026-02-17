# Library App

A full-stack library management system with a React Native mobile app and Express.js backend API.

## Overview

Library App is a multi-tenant library management system that allows managing multiple libraries with different settings. Features include book management, lending system, user authentication with role-based access control, and Google Books API integration.

## Tech Stack

### Frontend
- React Native 0.76.9 with Expo 53.0.11
- React Navigation (Bottom Tabs + Stack)
- React Native Paper for UI
- Axios for HTTP requests
- AsyncStorage for local data
- Expo FileSystem for image caching

### Backend
- Express.js 4.18.2
- PostgreSQL with Sequelize ORM (users, libraries, loans)
- MongoDB with Mongoose (books)
- JWT authentication with bcryptjs
- Helmet.js, CORS, Rate Limiting

### Infrastructure
- Docker & docker-compose
- GitHub Actions for CI/CD
- Jest & Supertest for testing

## Features

- User authentication with roles (admin, librarian, user)
- Book CRUD operations with rich metadata
- Lending system with due dates, renewals, and late fees
- Multi-library support with isolated data
- Full-text search on books
- Google Books API integration for enriching book data
- Role-based navigation and permissions
- **Image caching system** for offline access and improved performance (see [docs/IMAGE_CACHE.md](docs/IMAGE_CACHE.md))

## Quick Start

### Backend

```bash
cd library-backend
npm install

# Configure .env file (see Variables section below)

# Start databases with Docker
docker-compose up -d

# Run development server
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend

```bash
npm install

# Configure API URL in src/config/local.js
# export const API_URL = 'http://localhost:3000';

npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

## Environment Variables

Create a `.env` file in `library-backend/`:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

MONGODB_URI=mongodb://localhost:27017/library-app

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=library_users
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

GOOGLE_BOOKS_API_KEY=

CORS_ORIGIN=*

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Architecture

This project uses a hybrid database approach with two ORMs:

### What's an ORM?
An ORM (Object-Relational Mapping) is a tool that lets you interact with databases using JavaScript objects instead of writing raw SQL queries. It makes database operations simpler and more intuitive.

### Our Setup
- **Sequelize + PostgreSQL**: Handles relational data that needs strong consistency and relationships
  - Users (authentication, roles, profiles)
  - Libraries (multi-tenant settings)
  - Loans (tracking who borrowed what, with due dates and fees)

- **Mongoose + MongoDB**: Handles flexible, document-based data
  - Books (rich metadata that can vary between entries)
  - Enables full-text search on book content

This setup combines the best of both worlds: PostgreSQL's reliability for critical data and MongoDB's flexibility for content-heavy documents.

## User Roles

- **User**: Browse books, borrow/return books, view profile
- **Librarian**: All user permissions + manage books, handle loans
- **Admin**: All permissions + manage users, configure libraries, view statistics

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Books
- `GET /books` - List books (with search/filters)
- `GET /books/:id` - Book details
- `POST /books` - Add book (librarian)
- `PUT /books/:id` - Edit book (librarian)
- `DELETE /books/:id` - Delete book (librarian)
- `POST /books/:id/enrich` - Enrich with Google Books

### Loans
- `GET /loans` - User's loans
- `POST /loans` - Borrow book
- `PUT /loans/:id/return` - Return book (librarian)
- `PUT /loans/:id/renew` - Renew loan
- `GET /loans/overdue` - Overdue loans (librarian)

### Users & Libraries
- `GET /users` - List users (admin)
- `GET /users/:id` - User profile
- `PUT /users/:id` - Update profile
- `GET /libraries` - List libraries
- `PUT /libraries/:id` - Update library settings (admin)
- `GET /libraries/:id/statistics` - Library stats (admin)

## Testing

```bash
cd library-backend

npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

## Scripts

### Backend
- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm test` - Run tests
- `npm run build` - Build with esbuild

### Frontend
- `npm start` - Start Expo dev server
- `npm run android` - Launch on Android
- `npm run ios` - Launch on iOS
- `npm run web` - Launch on web

## Project Structure

```
library-app/
├── library-backend/
│   ├── src/
│   │   ├── models/       # Sequelize & Mongoose models
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Express middlewares
│   │   ├── services/     # Business logic
│   │   └── config/       # Database configs
│   └── tests/           # Jest tests
└── src/
    ├── screens/         # App screens
    ├── components/      # Reusable components
    ├── navigation/      # Navigation config
    ├── context/         # Global state (Auth)
    ├── services/        # API client, external services
    └── config/          # App configuration
```

## License

ISC
