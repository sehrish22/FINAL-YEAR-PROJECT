function checkSessionAuth(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user._id) {
        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({
                isLoggedIn: false,
                message: "Authentication required"
            });
        } else {
            // For regular requests, send a special redirect with a flag
            return res.redirect('/?showLogin=true');
        }
    }
    console.log(req.body);
    next();
}

module.exports = checkSessionAuth;