// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('personalweb', 'postgres', '01Mei2002', {
  host: 'localhost',
  dialect: 'postgres', // Tambahkan dialect PostgreSQL
  port: 5432
});

module.exports = sequelize;
