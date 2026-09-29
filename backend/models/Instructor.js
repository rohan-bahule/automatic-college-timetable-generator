const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instructor = sequelize.define('Instructor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maxBatchesPerWeek: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxLectureDivisions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: false
});

module.exports = Instructor;
