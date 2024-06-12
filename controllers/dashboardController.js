const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const db = require("../config/db");

// Route untuk halaman login
router.get("/", authController.login);

// Route untuk autentikasi
router.post("/auth", authController.authenticate);

// Route untuk dashboard
router.get("/dashboard/:username", (req, res) => {
  const username = req.params.username;
  if (req.session.username === username) {
    return res.render("dashboard", { username });
  } else {
    return res.redirect("/login");
  }
});

// Route untuk logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// Route untuk memuat form akses baru
router.get("/form_akses_baru", (req, res) => {
  res.render("partials/form_akses_baru");
});

// Route untuk memuat form akses lama
router.get("/form_akses_lama", (req, res) => {
  res.render("partials/form_akses_lama");
});

// Route untuk memuat form pengujian internal
router.get("/form_pengujian_internal", (req, res) => {
  res.render("partials/form_pengujian_internal");
});

// Route untuk memuat form pengujian eksternal
router.get("/form_pengujian_eksternal", (req, res) => {
  res.render("partials/form_pengujian_eksternal");
});

// Route untuk memuat history permohonan akses
router.get("/history_permohonan_akses", (req, res) => {
  const query = "SELECT * FROM permohonan_akses ORDER BY tanggal_permohonan";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).send("Error fetching data from database");
    }
    console.log("Data fetched successfully:", results);
    res.render("partials/history_permohonan_akses", { data: results });
  });
});

module.exports = router;
