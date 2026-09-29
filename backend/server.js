require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    const ensureDatabaseExists = require('./config/initDb');
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('MySQL connected successfully.');
    
    await sequelize.sync();
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();