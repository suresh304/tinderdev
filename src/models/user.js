const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        
    },
    age: {
        type: Number
    },
    password: {
        type: String
    },
    gender: {
        type: String,
        default:"male"
    },
    photoUrl:{
        type:String,
    },
    skills:{
        type:[String]
    },
    about:{
        type: String,
        maxlength: 200,
        trim: true
    }
})


 userSchema.methods.getJWT = async function () {
    const user = this
   const token=  await jwt.sign({ _id: user._id }, 'tinderdev')
   return token
    
 }

 userSchema.methods.isPasswordValid = async function (passwordInput,passwordHash) {
   const result = await bcrypt.compare(passwordInput, passwordHash)
   return result
    
 }

module.exports = mongoose.model('User', userSchema)
