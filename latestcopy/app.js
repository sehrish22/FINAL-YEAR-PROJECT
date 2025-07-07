var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var session = require("express-session");
var sessionAuth = require("./middlewares/sessionAuth");
var { v4: uuidv4 } = require("uuid"); // For unique session IDs
const dotenv = require("dotenv");

var indexRouter = require("./routes/index");
var productsRouter = require("./routes/products");
var adminRoutes = require("./routes/admin");
var userprofileRoutes = require("./routes/userprofile");
var buyerprofileRoutes = require("./routes/buyerprofile");
var ordersRoutes = require("./routes/orders");
var adoptionrequestsRoutes = require("./routes/adoptionrequests");
var profilesRoutes = require("./routes/profiles");
var petsRouter = require("./routes/pets");
var usersRouter = require("./routes/users");
var chatbotRoutes = require("./routes/chatbot");
var sitterapplicationsRoutes = require("./routes/sitterapplications");
var storesRouter = require("./routes/stores");
var vetsRouter = require("./routes/vets");
var newsletterRoutes = require("./routes/newsletter");
const flash = require("connect-flash");

var app = express();

// Body parsing middleware - must come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-strong-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'sessionId' // Add a specific name for the session cookie
  })
);

// Flash middleware
app.use(flash());

// Global variables for views
app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(sessionAuth);

app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
dotenv.config();

// Add error handling middleware for JSON responses
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Add middleware to ensure JSON responses for API routes
app.use('/products/cart', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Mount user routes first
app.use("/users", usersRouter);

// Then mount other routes
app.use("/", indexRouter);
app.use("/products", productsRouter);
app.use("/pets", petsRouter);
app.use("/admin", adminRoutes);
app.use("/admin", ordersRoutes);
app.use("/adoptionrequests", adoptionrequestsRoutes);
app.use("/userprofile", userprofileRoutes);
app.use("/buyerprofile", buyerprofileRoutes);
app.use("/userprofile", ordersRoutes);
app.use("/admin", profilesRoutes);
app.use("/products", ordersRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/images", express.static("public/imgs"));
app.use("/", sitterapplicationsRoutes);
app.use("/admin", sitterapplicationsRoutes);
app.use("/", storesRouter);
app.use("/admin", storesRouter);
app.use("/vets", vetsRouter);
app.use("/admin/vets", vetsRouter);
app.use("/newsletter", newsletterRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

mongoose
  .connect("mongodb://localhost/fypcrud", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connection successful"))
  .catch((error) => console.log(error.message));

module.exports = app;
