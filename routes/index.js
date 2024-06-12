const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const upload = multer({ dest: "uploads/" });

// Middleware untuk parsing body request
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Route untuk halaman login
router.get("/", (req, res) => {
  res.render("login", { error: null });
});

// Route untuk proses login
router.post("/login", [
  check("username", "Username tidak boleh kosong").notEmpty(),
  check("password", "Password tidak boleh kosong").notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map(error => error.msg).join("<br>"));
      return res.redirect("/");
    }

    const { username, password } = req.body;
    db.query("SELECT * FROM users WHERE username = ?", [username], (error, results) => {
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
    });
  }
]);

// Route untuk dashboard pengguna
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
    return res.redirect("/");
  });
});

// Route untuk menampilkan form akses baru
router.get("/form-akses-baru", (req, res) => {
  res.render("partials/form_akses_baru");
});

// Route untuk menampilkan history pengujian internal
router.get("/historyPengujianInternal", (req, res) => {
  db.query("SELECT * FROM pengujian_internal ORDER BY tanggal_pengajuan DESC", (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).send("Error fetching data");
    }
    res.render("partials/history_pengujian_internal", { data: results });
  });
});

// Route untuk menyimpan data form pengujian internal
router.post("/form_pengujian_internal", upload.single("dokumen_pendukung"), (req, res) => {
  const formData = {
    tanggal_pengajuan: req.body.tanggal,
    nama_aplikasi: req.body.nama_aplikasi,
    nama_pic: req.body.nama_pic,
    email_pic: req.body.email_pic,
    nomor_telepon: req.body.nomor_telepon,
    unit_kerja: req.body.unit_kerja,
    url_aplikasi: req.body.url_aplikasi,
    alamat_ip: req.body.alamat_ip,
    versi_aplikasi: req.body.versi_aplikasi,
    jenis_aplikasi: req.body.jenis_aplikasi,
    framework: req.body.framework,
    bahasa_pemrograman: req.body.bahasa_pemrograman,
    sistem_database: req.body.sistem_database,
    web_server: req.body.web_server,
    dokumen_pendukung: req.file ? req.file.filename : null,
  };

  const query = "INSERT INTO pengujian_internal SET ?";
  db.query(query, formData, (err, result) => {
    if (err) {
      console.error("Gagal menyimpan data: ", err);
      res.status(500).json({ success: false, message: "Gagal menyimpan data" });
    } else {
      res.json({ success: true, message: "Form submitted successfully" });
    }
  });
});

router.get("/api/cari-nip/:nip", async (req, res) => {
    const { nip } = req.params;
    try {
        const query = "SELECT NAMA as nama_pemohon, UNIT_KERJA_ESELON_II as unit_kerja FROM dapeg_mei2024 WHERE NIP = ?";
        const results = await db.promise().query(query, [nip]);
        if (results[0].length > 0) {
            res.json({ success: true, data: results[0][0] });
        } else {
            res.json({ success: false, message: "NIP/NIK tidak ditemukan" });
        }
    } catch (error) {
        console.error("Error fetching NIP:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mencari data" });
    }
});

// Route untuk mencari username VPN
router.get("/api/search-username-vpn", (req, res) => {
  const usernameVpn = req.query.username_vpn;
  if (!usernameVpn) {
    return res.status(400).json({ error: "Username VPN is required" });
  }

  const query = "SELECT nama_pemohon, nip_nik, unit_kerja FROM permohonan_akses WHERE username_vpn = ?";
  db.query(query, [usernameVpn], (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      res.status(500).json({ success: false, message: "Error fetching data" });
    } else {
      res.json({ success: true, data: results });
    }
  });
});

// Route untuk halaman dashboard_main
router.get("/dashboard_main", (req, res) => {
  // Query untuk mengambil jumlah total permohonan akses
  const queryPermohonan = "SELECT COUNT(*) AS total_permohonan FROM permohonan_akses";
  // Query untuk mengambil jumlah total pengujian keamanan
  const queryKeamanan = "SELECT COUNT(*) AS total_keamanan FROM pengujian_internal";
  // Query untuk mengambil jumlah total user terdaftar
  const queryUserTerdaftar = "SELECT COUNT(DISTINCT username_vpn) AS total_user FROM permohonan_akses";

  db.query(queryPermohonan, (errPermohonan, resultsPermohonan) => {
    if (errPermohonan) {
      console.error("Error fetching total permohonan akses: ", errPermohonan);
      res.render("dashboard_main", { error: "Gagal mengambil data total permohonan akses" });
    } else {
      const totalPermohonan = resultsPermohonan[0].total_permohonan;
      // Melakukan query kedua dalam callback yang pertama
      db.query(queryKeamanan, (errKeamanan, resultsKeamanan) => {
        if (errKeamanan) {
          console.error("Error fetching total pengujian keamanan: ", errKeamanan);
          res.render("dashboard_main", {
            totalPermohonan: totalPermohonan,
            error: "Gagal mengambil data total pengujian keamanan"
          });
        } else {
          const totalKeamanan = resultsKeamanan[0].total_keamanan;
          // Melakukan query ketiga dalam callback yang kedua
          db.query(queryUserTerdaftar, (errUser, resultsUser) => {
            if (errUser) {
              console.error("Error fetching total user terdaftar: ", errUser);
              res.render("dashboard_main", {
                totalPermohonan: totalPermohonan,
                totalKeamanan: totalKeamanan,
                error: "Gagal mengambil data total user terdaftar"
              });
            } else {
              const totalUser = resultsUser[0].total_user;
              res.render("dashboard_main", {
                totalPermohonan: totalPermohonan,
                totalKeamanan: totalKeamanan,
                totalUser: totalUser
              });
            }
          });
        }
      });
    }
  });
});

module.exports = router;
