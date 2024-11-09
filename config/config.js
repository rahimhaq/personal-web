require("dotenv").config(); // Memuat variabel lingkungan dari .env
const pg = require("pg"); // Mengimpor pg (PostgreSQL client)

module.exports = {
  "development": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectModule" : pg,
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectModule" : pg,
    "dialectOptions": {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
