var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var session = require("express-session");
var sessionAuth = require("./middlewares/sessionAuth");
var { v4: uuidv4 } = require('uuid'); // For unique session IDs

var indexRouter = require("./routes/index");
var productsRouter = require("./routes/products");
var adminRoutes = require("./routes/admin");
var userprofileRoutes = require("./routes/userprofile");
var ordersRoutes = require("./routes/orders");
var adoptionrequestsRoutes = require("./routes/adoptionrequests");
var profilesRoutes = require("./routes/profiles");
var petsRouter = require("./routes/pets");
var usersRouter = require("./routes/users");
var chatbotRoutes = require('./routes/chatbot');

var app = express();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "dummy text",
    resave: false,
    saveUninitialized: false,
    cookie: { expires: null },
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(sessionAuth);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/products", productsRouter);
app.use("/pets", petsRouter);
app.use("/admin", adminRoutes);
app.use("/admin", ordersRoutes);
app.use("/admin", adoptionrequestsRoutes);
app.use("/userprofile", userprofileRoutes);
app.use("/userprofile", ordersRoutes);
app.use("/userprofile", adoptionrequestsRoutes);
app.use("/admin", profilesRoutes);
app.use("/products", ordersRoutes);
app.use('/chatbot', chatbotRoutes);
app.use("/", usersRouter);
app.use("/images", express.static("public/imgs"));

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
