var express = require("express");
var router = express.Router();

router.get('/job', function(req, res, next) {
    res.render('jobandvolunteer/job');
  });
  router.get('/volunteer', function(req, res, next) {
    res.render('jobandvolunteer/volunteer');
  });