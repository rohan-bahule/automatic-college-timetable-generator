const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  studentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  divisionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = Batch;
