const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;
const moment = require("moment");
const hbs = require("hbs");
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pg = require("pg"); // Wajib ada
const { Sequelize, DataTypes } = require("sequelize");

// --- 1. SETUP DATABASE (Direct Connection agar Stabil di Vercel) ---
require("dotenv").config();

// Gunakan Connection String jika ada (lebih stabil), atau susun manual
const connectionString = process.env.POSTGRES_URL || `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}?sslmode=require`;

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectModule: pg, // Wajib untuk Vercel
  logging: false,    // Matikan log SQL biar console bersih
  pool: {
    max: 1,      // Limit koneksi serverless
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, 
    },
  },
});

module.exports = sequelize;

// --- Load Models ---
const User = require("./models/user");
const Project = require("./models/project");

// Relasi
User.hasMany(Project, { foreignKey: "author_id" });
Project.belongsTo(User, { foreignKey: "author_id" });

// --- 2. SETUP SESSION STORE ---
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "user_sessions",
});

// --- 3. ROUTE DARURAT (INIT DB) - WAJIB DI ATAS SESSION ---
// Route ini ditaruh DI SINI agar bisa dijalankan TANPA perlu login/session dulu
app.get("/init-db", async (req, res) => {
  try {
    // Cek koneksi dulu
    await sequelize.authenticate();
    console.log("Koneksi Database OK.");
    
    // Buat tabel session & lainnya
    await sessionStore.sync(); 
    await sequelize.sync({ alter: true });
    
    res.send("<h1>Sukses!</h1><p>Database Connected & Tables Created.</p><p>Sekarang silakan <a href='/login'>Login</a>.</p>");
  } catch (err) {
    console.error("Init Error:", err);
    res.status(500).send("<h1>Gagal Init DB</h1><pre>" + err.stack + "</pre>");
  }
});

// --- 4. CONFIG UTAMA EXPRESS ---
app.set("trust proxy", 1); // Wajib untuk Vercel

// Middleware Session (Baru dijalankan SETELAH route init-db lewat)
app.use(
  session({
    store: sessionStore,
    secret: "hariiniadalahbukankemarin",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Helpers & Static Files
hbs.registerHelper("includes", (array, value) => array && array.includes(value));
hbs.registerHelper("eq", (a, b) => a === b);
app.locals.formatDate = (date) => moment(date).format("MMMM D, YYYY");

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/asset", express.static(path.join(__dirname, "asset")));
app.use("/public/uploads", express.static("public/uploads"));

// --- Setup Multer ---
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });

// --- Middleware Auth ---
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// --- 5. ROUTES APLIKASI ---

app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login", { error: req.query.error });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      
      // Paksa simpan session sebelum redirect
      req.session.save((err) => {
        if (err) console.error(err);
        res.redirect("/");
      });
    } else {
      res.redirect("/login?error=Email/Password salah.");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login?error=Server Error");
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: req.query.error });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.redirect("/register?error=Email sudah terdaftar.");
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.redirect("/register?error=Server Error");
  }
});

app.get("/", isAuthenticated, async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: User, attributes: ["name"] }],
      order: [["id", "DESC"]],
    });

    const projectsWithAuthorAndDuration = projects.map((project) => {
      const startDate = moment(project.start_date);
      const endDate = moment(project.end_date);
      const duration = endDate.diff(startDate, "days");

      return {
        ...project.toJSON(),
        // HANDLING NULL AUTHOR AGAR TIDAK ERROR 500
        authorName: project.User ? project.User.name : "Unknown", 
        duration,
      };
    });

    res.render("index", {
      projects: projectsWithAuthorAndDuration,
      isLoggedIn: !!req.session.userId,
      userName: req.session.userName,
      userId: req.session.userId,
    });
  } catch (err) {
    console.error("Home Error:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// --- Route Tambahan (Project, Contact, dll) ---
// (Paste sisa route Anda di sini: /project, /contact, /edit-project, dll)
// Pastikan route yang pakai upload.single("image") ada di bawah sini.

app.get("/contact", (req, res) => {
  res.render("contact", { isLoggedIn: !!req.session.userId, userName: req.session.userName });
});

app.get("/project", isAuthenticated, (req, res) => {
    res.render("project", { isLoggedIn: !!req.session.userId, userName: req.session.userName });
});

app.post("/project", upload.single("image"), async (req, res) => {
    // ... (Logika add project Anda)
    // Pastikan req.body diproses dengan benar
    // Untuk mempersingkat, saya tidak copy semua logic add project Anda yang panjang, 
    // tapi Anda bisa tempel logic aslinya di sini.
    const { name, description } = req.body;
    // ...
    res.redirect("/");
});

// Listen Port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;