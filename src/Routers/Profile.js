const express = require('express')
const profileRouter = express.Router()
const {userAuth} = require('../middlewares/auth')
const User = require('../models/user')
const bcrypt = require('bcrypt');


const { validateSignup, validateProfileEdit, validateUpdatePassword } = require('../utils/validate')


profileRouter.get('/profile/view', userAuth, async (req, res) => {


    try {
       const user = req.user
       if(!user){
        res.send('no user found')
       }
       res.send(user)

    } catch (error) {
        res.status(400).send('something went wrong gettign profile')
    }


})

profileRouter.patch('/profile/edit', userAuth, async (req, res) => {


    try {
        if(!validateProfileEdit(req)){
            throw new Error("Invalid edit request");
        }
        const user = req.user
        const updateData = req.body

        const data = await User.findByIdAndUpdate(user._id,updateData,{new:true})
        // res.status(200).json({...data,updateData})
        res.status(200).json(data)
      

    } catch (error) {
        
res.status(400).send("error:"+error)

    }


})

profileRouter.patch('/profile/updatePassword',userAuth,async (req,res)=>{
    try {
        console.log("update password called route",req.body.newPassword)
        const result = await validateUpdatePassword(req)
        if(result){
            const hash = await bcrypt.hash(req.body.newPassword, 10)
            await User.findByIdAndUpdate(req.user._id,{password:hash})

            res.send({"message":"password updateion"})
        }else{
            throw new Error("mismatch existing password");
            
        }
         
    } catch (error) {
        res.send("the error is"+error)
    }

})


module.exports = {profileRouter}