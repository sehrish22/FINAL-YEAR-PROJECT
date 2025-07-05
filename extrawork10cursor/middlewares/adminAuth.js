function adminAuth(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    req.user = req.session.user;
    next();
  } else {
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({
        isLoggedIn: false,
        isAdmin: false,
        message: "Admin authentication required"
      });
    } else {
      // For regular requests, redirect to home with showLogin parameter and admin flag
      return res.redirect('/?showLogin=true&requireAdmin=true');
    }
  }
}

module.exports = adminAuth;