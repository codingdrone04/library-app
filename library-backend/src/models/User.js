const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const createUserModel = (sequelize) => {
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
      allowNull: true
    },
    preferred_genres: {
      type: DataTypes.JSONB,
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
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });

  // Méthodes
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  // Méthode statique pour trouver par username ou email
  User.findByUsernameOrEmail = function(identifier) {
    const { Op } = require('sequelize');
    return this.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier }
        ],
        is_active: true
      }
    });
  };

  return User;
};

module.exports = createUserModel;