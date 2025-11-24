const { DataTypes } = require('sequelize');

const createLibraryModel = (sequelize) => {
  const Library = sequelize.define('Library', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isUppercase: true,
        len: [2, 50]
      }
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\d\s\+\-\(\)]+$/i
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        max_loans_per_user: 5,
        loan_duration_days: 14,
        max_renewals: 2,
        late_fee_per_day: 0.50
      },
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'libraries',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Méthodes d'instance
  Library.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Library.prototype.getSettings = function() {
    return this.settings || {
      max_loans_per_user: 5,
      loan_duration_days: 14,
      max_renewals: 2,
      late_fee_per_day: 0.50
    };
  };

  Library.prototype.updateSettings = async function(newSettings) {
    this.settings = {
      ...this.getSettings(),
      ...newSettings
    };
    return this.save();
  };

  // Méthodes statiques
  Library.findByCode = function(code) {
    return this.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true
      }
    });
  };

  Library.getActiveLibraries = function() {
    return this.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
  };

  return Library;
};

module.exports = createLibraryModel;
