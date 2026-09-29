const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Division = sequelize.define('Division', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = Division;
