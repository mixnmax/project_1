const mysql = require("mysql");

// Konfigurasi koneksi database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "myapp",
});

// Koneksi ke database
db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err);
    return;
  }
  console.log("Terkoneksi ke database");
});

module.exports = db;
