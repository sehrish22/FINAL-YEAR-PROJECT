function checkSessionAuth(req,res,next){
    //sets variable for every pug file
    if (!req.session || !req.session.user || !req.session.user._id) {
      return res.redirect('/login');
      }
      console.log(req.body);
      next();
}
module.exports=checkSessionAuth;