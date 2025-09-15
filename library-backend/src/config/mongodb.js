const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_books';
    
    await mongoose.connect(mongoURI, options);
    
    console.log(`📚 MongoDB connecté: ${mongoose.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnecté');
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    throw error;
  }
};

module.exports = connectMongoDB;