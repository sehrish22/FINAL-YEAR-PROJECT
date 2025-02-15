router.get('/sellerprofile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    res.render('sellerprofile', { user: req.session.user }); // Pass user details to view
});
