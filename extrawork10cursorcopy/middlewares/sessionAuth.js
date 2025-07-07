function sessionAuth(req,res,next){
    //sets variable for every pug file
    res.locals.user=req.session.user;
    next();

}
module.exports=sessionAuth;