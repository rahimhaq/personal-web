const express = require("express");
const path = require('path');
const config = require("./config/config")
const bcrypt = require("bcrypt");
const multer = require("multer"); // Untuk upload gambar
const pool = require("./db"); // Mengimpor koneksi database dari db.js
const session = require("express-session");
const { Pool } = require("pg");
const pgSession = require("connect-pg-simple")(session);
const app = express();
const port = 3000;
const moment = require("moment");
const { Sequelize } = require("sequelize");

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

require("dotenv").config()

const environment = process.env.NODE_ENV
const sequelize = new Sequelize(config[environment]);

// Static files
app.use("/asset/css", express.static("asset/css"));
app.use("/asset/cv", express.static("asset/cv"));
app.use("/asset/img", express.static("asset/img"));
app.use("/asset/js", express.static("asset/js"));
app.use("/views", express.static("views"));
app.use("/public/uploads", express.static("public/uploads"));

// Middleware
app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new pgSession({
      pool, // Pool PostgreSQL Anda
      tableName: 'user_sessions' // Nama tabel untuk menyimpan session
    }),
    secret: "hariiniadalahbukankemarin",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
      secure: false, // Set `true` jika menggunakan HTTPS di production
    }
  })
);


// Middleware untuk proteksi halaman yang membutuhkan login
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Route GET halaman login
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/'); // Redirect ke home jika sudah login
  }
  res.render('login', { error: req.query.error });
});


// Login logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek apakah email ada di database
    const result = await pool.query("SELECT * FROM tb_users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (user) {
      // Jika email ditemukan, periksa password
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Jika password cocok, simpan userId ke session dan redirect ke halaman utama
        req.session.userId = user.id;
        req.session.userName = user.name; // Menyimpan nama user untuk ditampilkan di halaman utama
        return res.redirect("/");
      } else {
        // Password salah
        return res.redirect("/login?error=Email/Password salah.");
      }
    } else {
      // Email tidak ditemukan
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
    // Cek apakah email sudah digunakan
    const existingUser = await pool.query("SELECT * FROM tb_users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      return res.redirect("/register?error=Email sudah terdaftar.");
    }

    // Hash password dan simpan user baru ke database
    const hashedPassword = bcrypt.hashSync(password, 10);
    await pool.query("INSERT INTO tb_users (name, email, password) VALUES ($1, $2, $3)", [
      name,
      email,
      hashedPassword,
    ]);

    res.redirect("/login");
  } catch (err) {
    console.error(err.message);
    res.redirect("/register?error=Terjadi kesalahan pada server");
  }
});

// Route GET halaman utama dengan proteksi autentikasi dan relasi ke tb_users
app.get("/", isAuthenticated, async (req, res) => {
  try {
    // Query JOIN untuk mengambil proyek beserta informasi penulisnya
    const result = await pool.query(`
      SELECT 
        p.id AS project_id, 
        p.name AS project_name, 
        p.description, 
        p.start_date, 
        p.end_date, 
        u.name AS author, 
        p.technologies, 
        p.image
      FROM 
        tb_projects p
      INNER JOIN 
        tb_users u 
      ON 
        p.author_id = u.id
      ORDER BY 
        p.id DESC;
    `);

    // Kirim data proyek dan status login ke template index.hbs
    res.render("index", { 
      projects: result.rows, 
      isLoggedIn: !!req.session.userId, 
      userName: req.session.userName 
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/testimonial", isAuthenticated, (req, res) => {
  res.render("testimonial", {
    isLoggedIn: req.session.userId ? true : false,
    userName: req.session.userName  // Kirimkan nama pengguna
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

app.get("/project", isAuthenticated, async (req, res) => {
  try {
    // Data proyek bisa disesuaikan dengan kebutuhan Anda
    res.render("project", { 
      isLoggedIn: req.session.userId ? true : false,
      userName: req.session.userName  // Kirimkan nama pengguna
    });
  } catch (err) {
    console.error(err.message);
    res.redirect("/login?error=Terjadi kesalahan pada server");
  }
});


// Menampilkan Detail Proyek Berdasarkan ID
app.get("/project-detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM tb_projects WHERE id = $1", [id]);
    const project = result.rows[0];
    res.render("project-detail", { project });
  } catch (err) {
    console.error(err.message);
  }
});

// Menambah Proyek Baru
app.post("/project", upload.single("image"), async (req, res) => {
  const { name, description } = req.body;
  const start_date = moment(req.body.start_date).format("YYYY-MM-DD");
  const end_date = moment(req.body.end_date).format("YYYY-MM-DD");
  const technologies = Array.isArray(req.body.technologies) ? req.body.technologies : [req.body.technologies];
  const image = req.file ? req.file.filename : null;

  try {
    await pool.query(
      `INSERT INTO tb_projects (name, start_date, end_date, description, technologies, image)
       VALUES ($1, $2, $3, $4, $5::varchar[], $6)`,
      [name, start_date, end_date, description, technologies, image]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error adding project:", err.message);
    res.status(500).send("Error adding project");
  }
});

// Menampilkan Halaman Edit Proyek Berdasarkan ID
app.get("/edit-project/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM tb_projects WHERE id = $1", [id]);
    const project = result.rows[0];
    res.render("edit-project", { project, id });
  } catch (err) {
    console.error(err.message);
  }
});

// Memperbarui Proyek Berdasarkan ID
app.post("/edit-project/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, description } = req.body;
  const technologies = Array.isArray(req.body.technologies) ? req.body.technologies : [req.body.technologies];
  const image = req.file ? req.file.filename : null;

  try {
    await pool.query(
      `UPDATE tb_projects SET name = $1, start_date = $2, end_date = $3, description = $4, technologies = $5::varchar[], image = $6 WHERE id = $7`,
      [name, start_date, end_date, description, technologies, image, id]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error updating project:", err.message);
    res.status(500).send("Error updating project");
  }
});

// Menghapus Proyek Berdasarkan ID
app.post("/delete-project/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM tb_projects WHERE id = $1", [id]);
    res.redirect("/"); // Arahkan kembali ke halaman utama setelah menghapus
  } catch (err) {
    console.error("Error deleting project:", err.message);
    res.status(500).send("Error deleting project");
  }
});

// Menjalankan Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
