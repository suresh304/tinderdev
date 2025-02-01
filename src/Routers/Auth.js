const express = require('express')
const authRouter = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const { validateSignup } = require('../utils/validate')

authRouter.post('/login', async (req, res) => {

    // creating a new instance of user


    try {
        const { emailId, password } = req.body
        const existinguser = await User.findOne({ emailId: emailId })
        if (!existinguser) {
            throw new Error(" invalid credentials");

        }

        const isValid = await existinguser.isPasswordValid(password, existinguser.password)
        console.log("is valisdd", isValid)
        if (!isValid) {
            res.status(400).send('invalid credentials')
        } else {
            const token = await existinguser.getJWT()
            res.cookie('token', token)
            res.status(200).send(existinguser)
        }


    } catch (error) {
        res.status(401).send("something went wrong" + error)
    }


})


authRouter.post('/signup', async (req, res) => {

    // creating a new instance of user
    const hash = await bcrypt.hash(req.body.password, 10)
    const user = new User({ ...req.body, password: hash })

    try {
        console.log("user >>>>>>>>", user, hash)
        validateSignup(req)
       const savedUser= await user.save()
       const token = savedUser.getJWT()
       res.cookie('token',token)
        res.status(200).json({user:savedUser})
    } catch (error) {
        res.status(400).send('error saving the user')
    }


})


authRouter.post('/logout', async (req, res) => {



    try {
        res.cookie('token', null, {
            expires: new Date(Date.now())
        })
        res.send("user logout successfully")
    } catch (error) {
        res.status(400).send('something went wrong in logging out')
    }


})


module.exports = { authRouter }