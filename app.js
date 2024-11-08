const express = require("express");
const session = require("express-session");
const { Sequelize, DataTypes } = require("sequelize");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const config = require("./config/config");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const app = express();
const port = 3000;
const moment = require("moment");

// Ambil environment yang dipilih
require("dotenv").config()
const environment = process.env.NODE_ENV || "development";
const dbConfig = config[environment];
const sequelize = new Sequelize(dbConfig);

// Model untuk tabel users
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
});

// Model untuk tabel projects
const Project = sequelize.define("Project", {
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  start_date: DataTypes.DATE,
  end_date: DataTypes.DATE,
  technologies: DataTypes.ARRAY(DataTypes.STRING),
  image: DataTypes.STRING,
  author_id: { type: DataTypes.INTEGER, allowNull: false },
});

// Relasi antar tabel
User.hasMany(Project, { foreignKey: "author_id" });
Project.belongsTo(User, { foreignKey: "author_id" });

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

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
      secure: false, // Set `true` jika menggunakan HTTPS di production
    },
  })
);

// Static files
app.use("/asset", express.static(path.join(__dirname, "./assset")))
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

    res.render("index", {
      projects,
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
