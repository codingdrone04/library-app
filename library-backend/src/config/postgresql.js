const { Sequelize } = require('sequelize');

const connectPostgreSQL = async () => {
  try {
    console.log('🐘 Connexion à PostgreSQL...');
    
    const sequelize = new Sequelize(
      process.env.POSTGRES_DATABASE,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
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

    await sequelize.authenticate();
    console.log('✅ PostgreSQL connecté !');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error.message);
    throw error;
  }
};

module.exports = connectPostgreSQL;