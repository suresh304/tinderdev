 const jwt = require('jsonwebtoken')

 const validateSignup = (req) =>{
const {firstName,lastName,emailId,password} = req.body
// console.log("this is ",{firstName,lastname,emailId,password})
if(!firstName||!lastName){

    throw new Error("name is invalid");
    
}else if(!emailId||!password){
    throw new Error(" email or password is missing");
    
}
return true
}


const validateProfileEdit = (req)=>{

    const allowedFields = ["firstName","lastName","age","photoUrl","about"]

    const iseditAllowed = Object.keys(req.body).every((field)=>allowedFields.includes(field))

    return iseditAllowed;

}

const validateUpdatePassword =  async (req)=>{
    const {currentPassword,newPassword} = req.body
    const user = req.user
    try {
    console.log("validate update password is calsled")

        if(!(newPassword&&currentPassword)){
            throw new Error("invalid password type...");
        }

        
        return await user.isPasswordValid(currentPassword,user.password)

    } catch (error) {
        throw new Error("error in validateUpdatePassword"+error);
        
    }

}
module.exports = {validateSignup,validateProfileEdit,validateUpdatePassword}