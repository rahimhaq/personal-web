require("dotenv").config(); // Memuat variabel lingkungan dari .env
const pg = require("pg"); // Mengimpor pg (PostgreSQL client)

module.exports = {
  "development": {
    "username": process.env.POSTGRES_USER,
    "password": process.env.POSTGRES_PASSWORD,
    "database": process.env.POSTGRES_DATABASE,
    "host": process.env.POSTGRES_HOST,
    "dialect": "postgres",
    dialectModule : pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  "production": {
    "username": process.env.POSTGRES_USER,
    "password": process.env.POSTGRES_PASSWORD,
    "database": process.env.POSTGRES_DATABASE,
    "host": process.env.POSTGRES_HOST,
    "dialect": "postgres",
    dialectModule : pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
}
