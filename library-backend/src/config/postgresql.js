// library-backend/src/config/postgresql.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE || 'library_users',
  process.env.POSTGRES_USER || 'xenfroz',
  process.env.POSTGRES_PASSWORD || '',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectPostgreSQL = async () => {
  try {
    console.log('🐘 Tentative de connexion PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connecté !');
    
    // Sync des modèles
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false
    });
    console.log('📊 Tables PostgreSQL synchronisées');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
};

// IMPORTANT : Export de la fonction
module.exports = connectPostgreSQL;