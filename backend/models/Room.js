const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  seatingCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  roomType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = Room;
