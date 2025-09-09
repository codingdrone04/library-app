// library-backend/src/models/Loan.js
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/postgresql'); // ← CHANGEMENT ICI

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  book_id: {
    type: DataTypes.STRING, // ID MongoDB du livre
    allowNull: false
  },
  book_title: {
    type: DataTypes.STRING(500),
    allowNull: false // Cache pour affichage rapide
  },
  book_author: {
    type: DataTypes.STRING(300),
    allowNull: true // Cache auteur
  },
  book_isbn: {
    type: DataTypes.STRING(20),
    allowNull: true // Cache ISBN
  },
  status: {
    type: DataTypes.ENUM('active', 'returned', 'overdue', 'renewed'),
    defaultValue: 'active'
  },
  borrowed_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returned_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  renewal_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_renewals: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  librarian_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  late_fees: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'loans',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['book_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    },
    {
      // Index partiel PostgreSQL - un utilisateur ne peut emprunter le même livre qu'une fois
      unique: true,
      fields: ['user_id', 'book_id'],
      where: {
        status: {
          [Op.in]: ['active', 'renewed']
        }
      },
      name: 'unique_active_loan'
    }
  ],
  hooks: {
    beforeCreate: (loan) => {
      // Calculer la date de retour (14 jours par défaut)
      if (!loan.due_date) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        loan.due_date = dueDate;
      }
    }
  }
});

// Méthodes d'instance
Loan.prototype.isOverdue = function() {
  return new Date() > this.due_date && this.status === 'active';
};

Loan.prototype.canRenew = function() {
  return this.renewal_count < this.max_renewals && this.status === 'active';
};

Loan.prototype.renewLoan = async function(additionalDays = 14) {
  if (!this.canRenew()) {
    throw new Error('Ce prêt ne peut pas être renouvelé');
  }
  
  this.renewal_count += 1;
  this.status = 'renewed';
  
  const newDueDate = new Date(this.due_date);
  newDueDate.setDate(newDueDate.getDate() + additionalDays);
  this.due_date = newDueDate;
  
  return this.save();
};

Loan.prototype.returnBook = async function() {
  this.status = 'returned';
  this.returned_date = new Date();
  return this.save();
};

// Méthodes statiques
Loan.getActiveLoansForUser = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      status: {
        [Op.in]: ['active', 'renewed']
      }
    },
    order: [['due_date', 'ASC']]
  });
};

Loan.getOverdueLoans = function() {
  return this.findAll({
    where: {
      due_date: {
        [Op.lt]: new Date()
      },
      status: {
        [Op.in]: ['active', 'renewed']
      }
    },
    include: [{
      model: require('./User'),
      as: 'user'
    }]
  });
};

module.exports = Loan;