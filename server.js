const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const moment = require("moment");
const indexRouter = require("./routes/index");
const historyRouter = require("./routes/history");
const dashboardController = require("./controllers/dashboardController");

const app = express();
app.locals.moment = moment;

// Middleware untuk mencegah caching
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Middleware untuk melayani file statis
app.use(express.static("public"));

// Set view engine ke EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware untuk parsing URL-encoded data
app.use(express.urlencoded({ extended: false }));

// Middleware untuk sesi
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware untuk flash messages
app.use(flash());

// Gunakan router
app.use("/", indexRouter);
app.use("/", historyRouter);
app.use("/", dashboardController);


app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
