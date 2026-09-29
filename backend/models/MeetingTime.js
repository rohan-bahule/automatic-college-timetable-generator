const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MeetingTime = sequelize.define('MeetingTime', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pid: {
    type: DataTypes.STRING,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slotType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = MeetingTime;
