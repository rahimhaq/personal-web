// db.js
const { Sequelize } = require('sequelize');
require("dotenv").config(); // Memuat file .env

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    dialect: "postgres", // Pastikan menggunakan dialect PostgreSQL
    port: 5432, // Pastikan port PostgreSQL sesuai
  }
);
module.exports = sequelize;
