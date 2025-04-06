function checkSessionAuth(req,res,next){
    //sets variable for every pug file
    if (!req.session || !req.session.user || !req.session.user._id) {
        return res.status(401).send("Unauthorized: Please log in first");
      }
      console.log(req.body);
      next();
}
module.exports=checkSessionAuth;