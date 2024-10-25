const express = require("express");
const app = express();
const port = 3000;

// routing
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/about", (req, res) => {
  res.send("Ini adalah halaman about");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});