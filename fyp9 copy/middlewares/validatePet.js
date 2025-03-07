const {validate} = require('../models/pet');
function validatePet(req,res,next){
    //sets variable for every pug file
    let error =validate(req.body);
    //if(error) return res.status(400).send(error.details[0].message);
    next();

}
module.exports=validatePet;