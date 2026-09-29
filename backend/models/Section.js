const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numClassesPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isElective: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  electiveGroup: {
    type: DataTypes.STRING,
    allowNull: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  divisionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  meetingTimeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = Section;
