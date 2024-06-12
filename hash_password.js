const bcrypt = require("bcrypt");
const db = require("./config/db"); // pastikan path ke file db.js benar

const username = "admin";
const plainTextPassword = "admin";

bcrypt.hash(plainTextPassword, 10, (err, hashedPassword) => {
  if (err) {
    return console.error("Error hashing password:", err);
  }

  db.query(
    "UPDATE users SET password = ? WHERE username = ?",
    [hashedPassword, username],
    (error, results) => {
      if (error) {
        return console.error("Error updating password in database:", error);
      }
      console.log("Password updated successfully!");
      db.end(); // tutup koneksi database setelah selesai
    },
  );
});
