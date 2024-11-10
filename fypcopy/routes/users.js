var express = require('express');
var router = express.Router();
var {User} = require('../models/user');
var bcrypt = require('bcryptjs');
const _ = require ('lodash');
const jwt = require ('jsonwebtoken');

//for signup
router.get('/register', function(req, res, next) {
  res.render('users/register');
});
router.post('/register',async function(req, res, next) {
  let user = await User.findOne({email:req.body.email});
  if(user) return res.status(400).send("User with given email already exists");
  user=new User(req.body);
  let salt = await bcrypt.genSalt(10);
  user.password =await bcrypt.hash(user.password,salt);
  await user.save();
  // return res.send(_.pick(user,["name","email"])); **********************
  res.redirect('/');
});
//for log in
router.get('/login', function(req, res, next) {
  res.render('users/login');
});
router.post('/login',async function(req, res, next) {
  user=await User.findOne({email:req.body.email});
  if(!user) return res.redirect('/login');  //res.status(400).send("User does not exists exists");
  let isvalid = await bcrypt.compare(req.body.password,user.password);
  if(!isvalid) return res.status(401).send("invalid password");

  req.session.user = user;
  return res.redirect('/');
});
//for logout
router.get('/logout', function(req, res, next) {
  req.session.user = null;
  res.redirect('/login');
});
module.exports = router;
