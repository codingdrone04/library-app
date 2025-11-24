/**
 * Script pour réinitialiser complètement la base PostgreSQL
 * ⚠️ ATTENTION : Supprime toutes les données !
 */

require('dotenv').config();
const connectPostgreSQL = require('../src/config/postgresql');
const mongoose = require('mongoose');

async function resetDatabase() {
  let sequelize;

  try {
    console.log('⚠️  ========================================');
    console.log('⚠️  RÉINITIALISATION DE LA BASE DE DONNÉES');
    console.log('⚠️  Toutes les données seront SUPPRIMÉES !');
    console.log('⚠️  ========================================\n');

    // Attendre 3 secondes pour annuler si erreur
    console.log('⏱️  Démarrage dans 3 secondes... (Ctrl+C pour annuler)');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🐘 Connexion à PostgreSQL...');
    sequelize = await connectPostgreSQL();
    console.log('✅ Connecté à PostgreSQL\n');

    // Supprimer les tables dans l'ordre
    console.log('🗑️  Suppression des tables PostgreSQL...');

    await sequelize.query('DROP TABLE IF EXISTS loans CASCADE');
    console.log('   ✅ Table loans supprimée');

    await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('   ✅ Table users supprimée');

    await sequelize.query('DROP TABLE IF EXISTS libraries CASCADE');
    console.log('   ✅ Table libraries supprimée');

    // Supprimer les types ENUM
    console.log('\n🗑️  Suppression des types ENUM...');

    await sequelize.query('DROP TYPE IF EXISTS enum_users_role CASCADE');
    console.log('   ✅ Type enum_users_role supprimé');

    await sequelize.query('DROP TYPE IF EXISTS enum_loans_status CASCADE');
    console.log('   ✅ Type enum_loans_status supprimé');

    console.log('\n✅ Base PostgreSQL complètement réinitialisée !');

    // MongoDB (optionnel)
    try {
      console.log('\n📚 Connexion à MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connecté à MongoDB');

      console.log('\n🗑️  Suppression de la collection books...');
      await mongoose.connection.db.dropCollection('books').catch(() => {
        console.log('   ℹ️  Collection books n\'existe pas (OK)');
      });
      console.log('   ✅ Collection books supprimée');

      console.log('\n✅ Base MongoDB réinitialisée !');
    } catch (mongoError) {
      console.log('\n⚠️  MongoDB non accessible (non bloquant)');
    }

    console.log('\n🎉 ========================================');
    console.log('🎉 RÉINITIALISATION TERMINÉE');
    console.log('🎉 ========================================');
    console.log('\n💡 Prochaines étapes :');
    console.log('   1. Redémarrez le serveur : npm start');
    console.log('   2. Les tables seront recréées automatiquement');
    console.log('   3. La bibliothèque et les users seront créés\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation :');
    console.error(error);
    process.exit(1);

  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Gestion Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Réinitialisation annulée par l\'utilisateur');
  process.exit(0);
});

// Lancer la réinitialisation
resetDatabase();
