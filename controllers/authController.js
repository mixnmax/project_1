const db = require("../config/db");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");

// Halaman login
exports.login = (req, res) => {
  res.render("login", { messages: req.flash() });
};

// Autentikasi pengguna
exports.authenticate = [
  // Validasi input
  check("username", "Username tidak boleh kosong").notEmpty(),
  check("password", "Password tidak boleh kosong").notEmpty(),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors
          .array()
          .map((error) => error.msg)
          .join("<br>"),
      );
      return res.redirect("/");
    }

    const { username, password } = req.body;

    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (error, results) => {
        if (error) {
          console.error("Error in the query", error);
          req.flash("error", "Kesalahan dalam query");
          return res.redirect("/");
        }
        if (results.length > 0) {
          const user = results[0];
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              console.error("Error comparing passwords", err);
              req.flash("error", "Kesalahan membandingkan password");
              return res.redirect("/");
            }
            if (isMatch) {
              req.session.username = user.username;
              return res.redirect(`/dashboard/${user.username}`);
            } else {
              req.flash("error", "Password salah");
              return res.redirect("/");
            }
          });
        } else {
          req.flash("error", "Username tidak ditemukan");
          return res.redirect("/");
        }
      },
    );
  },
];

// Dashboard pengguna
exports.dashboard = (req, res) => {
  if (!req.session.username) {
    req.flash("error", "Anda harus login terlebih dahulu");
    return res.redirect("/");
  }
  res.render("dashboard", { username: req.session.username });
};
