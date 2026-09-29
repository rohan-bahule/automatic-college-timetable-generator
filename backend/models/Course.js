const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  courseType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false
  },
  isElective: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: false
});

module.exports = Course;
