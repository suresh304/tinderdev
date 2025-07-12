const express = require('express')
const authRouter = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const { validateSignup } = require('../utils/validate')

authRouter.post('/login', async (req, res) => {

  // creating a new instance of user
  console.log('login>>>>>>>>>>>>>>>>>>')


  try {
    const { emailId, password } = req.body
    // const existinguser = await User.findOne({ emailId: emailId })

    const existingUser = await User.findOne({ emailId: new RegExp(`^${emailId}$`, 'i') });
    console.log(existingUser)

    if (!existingUser) {
      throw new Error(" invalid credentials");

    }

    const isValid = await existingUser.isPasswordValid(password, existingUser.password)
    if (!isValid) {
      res.status(400).send('invalid credentials')
    } else {
      const token = await existingUser.getJWT()

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,         // allow non-HTTPS
        sameSite: 'lax'        // allows top-level navigation
      });

      // res.cookie('token', token)
      res.status(200).send(existingUser)
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
    validateSignup(req)
    const savedUser = await user.save()
    const token = savedUser.getJWT()
    res.cookie('token', token)
    res.status(200).json({ user: savedUser })
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


authRouter.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Deployment Check</title>
        <style>
          body {
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 50px;
          }
          .card {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: inline-block;
          }
          .status {
            color: green;
            font-size: 18px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 Backend Deployment Successful1 💕</h1>
          <p class="status">Status: OK</p>
          <p>Build Time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});


module.exports = { authRouter }