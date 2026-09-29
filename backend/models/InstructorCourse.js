const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InstructorCourse = sequelize.define('InstructorCourse', {
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  timestamps: false
});

module.exports = InstructorCourse;
