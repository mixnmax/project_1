const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Mengimpor konfigurasi database
const moment = require("moment"); // Mengimpor moment
const ExcelJS = require("exceljs");

// Route untuk menampilkan history permohonan akses
router.get("/history-permohonan-akses", (req, res) => {
  const { startDate, endDate } = req.query;
  const query =
    "SELECT * FROM permohonan_akses WHERE tanggal_permohonan BETWEEN ? AND ? ORDER BY tanggal_permohonan DESC";
  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).send("Error fetching data from database");
    }
    // Ubah format tanggal di server
    results.forEach((permohonan) => {
      permohonan.tanggal_permohonan = moment(
        permohonan.tanggal_permohonan,
      ).format("DD-MM-YYYY");
    });
    console.log("Data fetched successfully:", results);
    res.json({
      data: results,
    });
  });
});

router.get("/export-excel", async (req, res) => {
  const { startDate, endDate } = req.query; // Mengambil tanggal dari query parameter

  const query = `
        SELECT tanggal_permohonan, nama_pemohon, unit_kerja 
        FROM permohonan_akses 
        WHERE tanggal_permohonan BETWEEN ? AND ? 
        ORDER BY tanggal_permohonan DESC
    `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching data for Excel:", err);
      return res.status(500).send("Error fetching data");
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Permohonan Akses");

      worksheet.columns = [
        { header: "Tanggal Permohonan", key: "tanggal_permohonan", width: 20 },
        { header: "Nama Pemohon", key: "nama_pemohon", width: 30 },
        { header: "Unit Kerja", key: "unit_kerja", width: 30 },
      ];

      results.forEach((item) => {
        worksheet.addRow(item);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="report.xlsx"',
      );
      workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    } catch (error) {
      console.error("Failed to export Excel:", error);
      res.status(500).send("Failed to export Excel");
    }
  });
});

// Route untuk menangani form submission
router.post('/submit-permohonan-lama', (req, res) => {
    const {
        tanggal_permohonan, username_vpn, nama_pemohon, nip_nik, unit_kerja,
        email, ip_server, service, port, akses, dokumen_pendukung
    } = req.body;

    // Query untuk memasukkan data ke dalam database
    const query = `
        INSERT INTO permohonan_akses_lama (tanggal_permohonan, username_vpn, nama_pemohon, nip_nik, unit_kerja, email, ip_server, service, port, akses, dokumen_pendukung)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [tanggal_permohonan, username_vpn, nama_pemohon, nip_nik, unit_kerja, email, ip_server, JSON.stringify(service), port, akses, dokumen_pendukung], (err, results) => {
        if (err) {
            console.error('Error inserting data: ', err);
            return res.status(500).send('Error inserting data into database');
        }
        res.send('Data successfully submitted');
    });
});

module.exports = router;
