require("dotenv").config();
const pg = require("pg");

module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
    dialectModule: require("pg"),
    dialectOptions: process.env.POSTGRES_HOST === "localhost" ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
    dialectModule: require("pg"), // Wajib untuk Vercel
    
    // --- TAMBAHAN PENTING UNTUK MENGATASI CONNECTION TERMINATED ---
    pool: {
      max: 1,       // Maksimal 1 koneksi per instance (PENTING!)
      min: 0,       // Izinkan koneksi sampai 0 saat sepi
      acquire: 30000, // Waktu tunggu maksimal 30 detik
      idle: 10000,  // Putus koneksi jika menganggur 10 detik
    },
    // -------------------------------------------------------------

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Wajib false untuk database cloud gratisan
      },
      keepAlive: true, // Opsional: menjaga koneksi tetap hidup
    },
    sslmode: "require",
  },
};