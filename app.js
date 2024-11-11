const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;
const moment = require("moment");
const hbs = require("hbs");
hbs.registerHelper("includes", (array, value) => array && array.includes(value));


// Ambil environment yang dipilih
require("dotenv").config()
const { Sequelize, DataTypes } = require("sequelize");
const config = require("./config/config");
const environment = process.env.NODE_ENV || "development";
const dbConfig = config[environment];
const sequelize = new Sequelize(dbConfig);
module.exports = sequelize; // Ekspor sequelize untuk digunakan di bagian lain

// Impor model
const User = require("./models/user");
const Project = require("./models/project");

// Relasi antar tabel
User.hasMany(Project, { foreignKey: "author_id" });
Project.belongsTo(User, { foreignKey: "author_id" });

const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Tentukan path ke folder uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');

// Periksa apakah folder uploads ada
if (!fs.existsSync(uploadsDir)) {
  // Jika folder belum ada, buat folder uploads
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Folder uploads berhasil dibuat.');
} else {
  console.log('Folder uploads sudah ada.');
}

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);  // Menggunakan uploadsDir yang telah diverifikasi
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);  // Nama file yang diubah menjadi unik
  },
});

const upload = multer({ storage: storage });

module.exports = upload;  // Ekspor objek upload untuk digunakan di route

// Konfigurasi session store menggunakan Sequelize
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "user_sessions",
});

app.use(
  session({
    store: sessionStore,
    secret: "hariiniadalahbukankemarin",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Static files
app.use("/asset", express.static(path.join(__dirname, "asset")))
app.use("/asset/css", express.static("asset/css"));
app.use("/asset/cv", express.static("asset/cv"));
app.use("/asset/img", express.static("asset/img"));
app.use("/asset/js", express.static("asset/js"));
app.use("/views", express.static("views"));
app.use("/public/uploads", express.static("public/uploads"));

// Middleware
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware untuk proteksi halaman yang membutuhkan login
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Route GET halaman login
app.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("login", { error: req.query.error });
});

// Login logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    console.log("User  ditemukan:", user);

    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      return res.redirect("/");
    } else {
      return res.redirect("/login?error=Email/Password salah.");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login?error=Terjadi kesalahan pada server");
  }
});

// Route GET halaman register
app.get("/register", (req, res) => {
  res.render("register", { error: req.query.error });
});

// Route POST untuk proses registrasi
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    console.log("User  ditemukan:", existingUser);

    if (existingUser) {
      return res.redirect("/register?error=Email sudah terdaftar.");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.create({ name, email, password: hashedPassword });

    res.redirect("/login");
  } catch (err) {
    console.error(err.message);
    res.redirect("/register?error=Terjadi kesalahan pada server");
  }
});

// Route GET halaman utama dengan proteksi autentikasi
app.get("/", isAuthenticated, async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: User, attributes: ["name"] }],
      order: [["id", "DESC"]],
    });

    const projectsWithAuthorAndDuration = projects.map((project) => {
      const startDate = moment(project.start_date);
      const endDate = moment(project.end_date);
      const duration = endDate.diff(startDate, "days"); // Hitung durasi dalam hari

      return {
        ...project.toJSON(),
        authorName: project.User.name, // Ambil nama berdasarkan data User saat registrasi
        duration,
      };
    });

    res.render("index", {
      projects: projectsWithAuthorAndDuration,
      isLoggedIn: !!req.session.userId,
      userName: req.session.userName,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/testimonial", isAuthenticated, (req, res) => {
  res.render("testimonial", {
    isLoggedIn: !!req.session.userId,
    userName: req.session.userName,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err.message);
    }
    res.redirect("/login");
  });
});


app.get("/project", isAuthenticated, (req, res) => {
  res.render("project", {
    isLoggedIn: !!req.session.userId,
    userName: req.session.userName,
  });
});

app.get("/project-detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findByPk(id, {
      include: [{ model: User, attributes: ["name"] }],
    });
    res.render("project-detail", { project });
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/project", upload.single("image"), async (req, res) => {
  const { name, description } = req.body;
  const start_date = moment(req.body.start_date).toDate();
  const end_date = moment(req.body.end_date).toDate();
  const technologies = Array.isArray(req.body.technologies)
    ? req.body.technologies
    : [req.body.technologies];
  const image = req.file ? req.file.filename : null;

  try {
    await Project.create({
      name,
      description,
      start_date,
      end_date,
      technologies,
      image,
      author_id: req.session.userId,
    });
    res.redirect("/");
  } catch (err) {
    console.error("Error adding project:", err.message);
    res.status(500).send("Error adding project");
  }
});

// Route to show the edit form for a specific project
app.get("/edit-project/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).send("Project not found");
    }
    if (project.author_id !== req.session.userId) {
      return res.status(403).send("You are not authorized to edit this project");
    }
    res.render("edit-project", { project });
  } catch (err) {
    console.error("Error fetching project for editing:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/edit-project/:id", isAuthenticated, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const start_date = moment(req.body.start_date).toDate();
  const end_date = moment(req.body.end_date).toDate();
  const technologies = Array.isArray(req.body.technologies)
    ? req.body.technologies
    : [req.body.technologies];
  const image = req.file ? req.file.filename : null;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).send("Project not found");
    }
    if (project.author_id !== req.session.userId) {
      return res.status(403).send("You are not authorized to edit this project");
    }

    // Update the project fields
    project.name = name;
    project.description = description;
    project.start_date = start_date;
    project.end_date = end_date;
    project.technologies = technologies;
    if (image) project.image = image;

    await project.save(); // Save the updated project
    res.redirect("/");
  } catch (err) {
    console.error("Error updating project:", err.message);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/delete-project/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Project.destroy({ where: { id } });
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting project:", err.message);
    res.status(500).send("Error deleting project");
  }
});

app.listen(port, async () => {
  await sequelize.sync(); // Sinkronisasi Sequelize dengan database
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app; // Ekspor aplikasi Express
