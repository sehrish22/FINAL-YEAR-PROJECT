var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.get('/register', function(req, res, next) {
  res.render('users/register');
});
router.post('/register',async function(req, res, next) {
  let user=new User(req.body);
  await user.save();
  res.redirect('/');
});

module.exports = router;
