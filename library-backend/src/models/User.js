// library-backend/src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgresql'); // ← CHANGEMENT ICI
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstname: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastname: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'librarian', 'admin'),
    defaultValue: 'user'
  },
  age: {
    type: DataTypes.INTEGER,
    validate: {
      min: 13,
      max: 120
    }
  },
  preferred_genres: {
    type: DataTypes.JSONB, // ← CHANGEMENT ICI (JSONB pour PostgreSQL)
    defaultValue: []
  },
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true, // createdAt, updatedAt
  indexes: [ // ← AJOUT D'INDEX POSTGRESQL
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

// Méthodes d'instance
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  return this.save();
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash; // Ne jamais exposer le hash
  return values;
};

// Méthodes statiques
User.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    where: {
      [require('sequelize').Op.or]: [
        { username: identifier },
        { email: identifier }
      ],
      is_active: true
    }
  });
};

module.exports = User;