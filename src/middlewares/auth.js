const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req,res,next)=>{



    try {
        const {token} = req.cookies
        if(!token){
            throw new Error("token expired.....");
        }
        const decodedObj = jwt.verify(token,process.env.JWT_SECRET)
        console.log(decodedObj)
        const user =  await User.findById(decodedObj._id)
        if(!user){
            res.send("invalid token/pls login")
        }
      req.user = user
        next()  
    } catch (error) {
        
        res.status(401).send({message:"something went wrong",error:error})
    }

    
}

module.exports = {userAuth}