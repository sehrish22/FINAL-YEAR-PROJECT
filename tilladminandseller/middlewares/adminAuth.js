function checkAdminAuth(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    return res.redirect("/login");
  }
}
module.exports = checkAdminAuth;