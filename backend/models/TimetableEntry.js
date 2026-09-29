const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TimetableEntry = sequelize.define('TimetableEntry', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  timetableRunId: { type: DataTypes.INTEGER, allowNull: false },
  sectionId: { type: DataTypes.INTEGER, allowNull: true },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  meetingTimeId: { type: DataTypes.INTEGER, allowNull: false },
  roomId: { type: DataTypes.INTEGER, allowNull: false },
  instructorId: { type: DataTypes.INTEGER, allowNull: false },
  divisionId: { type: DataTypes.INTEGER, allowNull: true },
  batchId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'timetable_entries',
  timestamps: true
});

module.exports = TimetableEntry;
