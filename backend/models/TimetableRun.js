const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TimetableRun = sequelize.define('TimetableRun', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  conflictCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  timeTakenSec: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'timetable_runs',
  timestamps: true
});

module.exports = TimetableRun;
