const express = require("express");
const multer = require("multer"); // Untuk upload gambar
const pool = require("./db"); // Mengimpor koneksi database dari db.js
const app = express();
const port = 3000;
const moment = require("moment");

app.set("view engine", "hbs");

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "views/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Static files
app.use("/asset/css", express.static("asset/css"));
app.use("/asset/cv", express.static("asset/cv"));
app.use("/asset/img", express.static("asset/img"));
app.use("/asset/js", express.static("asset/js"));
app.use("/views", express.static("views"));
app.use("/views/uploads", express.static("views/uploads"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute Utama untuk Menampilkan Semua Project
app.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tb_projects ORDER BY id DESC"
    );
    res.render("index", { projects: result.rows });
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/testimonial", (req, res) => {
  res.render("testimonial");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tb_projects");
    const projects = result.rows.map(project => {
      return {
        ...project,
        short_description: project.description.length > 100
          ? project.description.substring(0, 100) + "..."
          : project.description
      };
    });
    res.render("index", { projects }); // Kirim `short_description` ke halaman My Project
  } catch (err) {
    console.error("Error fetching projects:", err.message);
    res.status(500).send("Error fetching projects");
  }
});


// Rute untuk Menampilkan Semua Proyek di Halaman /project
app.get("/project", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tb_projects ORDER BY id DESC"
    );
    res.render("project", { projects: result.rows });
  } catch (err) {
    console.error(err.message);
  }
});

// Menampilkan Detail Proyek Berdasarkan ID
app.get("/project-detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM tb_projects WHERE id = $1", [
      id,
    ]);
    const project = result.rows[0];
    res.render("project-detail", { project });
  } catch (err) {
    console.error(err.message);
  }
});

// Menambah Proyek Baru


// Menambah Proyek Baru
app.post("/project", upload.single("image"), async (req, res) => {
  const { name, description } = req.body;
  // Format tanggal ke "YYYY-MM-DD" menggunakan moment
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
    const result = await pool.query("SELECT * FROM tb_projects WHERE id = $1", [
      id,
    ]);
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
