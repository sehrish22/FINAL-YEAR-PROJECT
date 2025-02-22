const {validate} = require('../models/product');
function validateProduct(req,res,next){
    //sets variable for every pug file
    let error =validate(req.body);
    //if(error) return res.status(400).send(error.details[0].message);
    next();

}
module.exports=validateProduct;