function checkBuyerAuth(req, res, next) {
    if (!req.session || !req.session.user || req.session.user.role !== "buyer") {
      return res.redirect('/login');
    }
    next();
  }
  module.exports = checkBuyerAuth;
  