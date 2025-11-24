-- Script pour RÉINITIALISER complètement la base PostgreSQL
-- ⚠️ ATTENTION : Ceci SUPPRIME TOUTES LES DONNÉES !

-- Supprimer les tables dans le bon ordre (à cause des foreign keys)
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS libraries CASCADE;

-- Supprimer les types ENUM
DROP TYPE IF EXISTS enum_users_role CASCADE;
DROP TYPE IF EXISTS enum_loans_status CASCADE;

-- Afficher un message
SELECT 'Base de données réinitialisée. Redémarrez le serveur pour recréer les tables.' AS message;
