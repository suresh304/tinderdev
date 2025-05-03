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


authRouter.get('/test', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Deployment Test</title>
          <style>
            body {
              background: #f2f2f2;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
    
            .card {
              background: white;
              border-radius: 12px;
              box-shadow: 0 8px 16px rgba(0,0,0,0.1);
              padding: 32px;
              text-align: center;
              max-width: 400px;
              transition: 0.3s ease-in-out;
            }
    
            .card:hover {
              transform: translateY(-5px);
              box-shadow: 0 12px 20px rgba(0,0,0,0.2);
            }
    
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #333;
              margin-bottom: 12px;
            }
    
            .subtitle {
              font-size: 16px;
              color: #777;
              margin-bottom: 20px;
            }
    
            .status {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">🚀 Deployment Successful!</div>
            <div class="subtitle">Your backend is up and running.</div>
            <div class="status">Status: OK</div>
          </div>
        </body>
        </html>
      `);


})

module.exports = { authRouter }