const express = require('express')
const authRouter = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { validateSignup } = require('../utils/validate')

function generateJWT(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

authRouter.post('/login', async (req, res) => {
  console.log('login>>>>>>>>>>>>>>>>>>');

  const db = req.app.locals.db;
  const { emailId, password } = req.body;

  try {
    // Case-insensitive email lookup
    const result = await db.query(
      `SELECT * FROM users WHERE LOWER(email_id) = LOWER($1)`,
      [emailId]
    );

    const existingUser = result.rows[0];

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, existingUser.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateJWT(existingUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,         // Set to true in production (HTTPS)
      sameSite: 'lax'
    });

    // Exclude password before sending back user
    const { password: _, ...userWithoutPassword } = existingUser;

    res.status(200).json(userWithoutPassword);

  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
});


authRouter.post('/signup', async (req, res) => {
  const db = req.app.locals.db;
  console.log(req.body)
  const { firstName, lastName, emailId, password, age, gender, about, photoUrl } = req.body;

  try {
    // ✅ Validate input (optional, if you have logic)
    validateSignup(req);

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Check if email already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email_id = $1', [emailId]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // ✅ Insert user
    const result = await db.query(`
      INSERT INTO users (first_name, last_name, email_id, password, age, gender, about, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name, last_name, email_id, age, gender, about, photo_url
    `, [
      firstName,
      lastName,
      emailId,
      hashedPassword,
      age,
      gender,
      about || '',
      photoUrl || ''
    ]);

    const savedUser = result.rows[0];

    // ✅ Generate JWT token
    const token = generateJWT(savedUser);
    res.cookie('token', token, { httpOnly: true });

    res.status(200).json({ user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error saving the user' });
  }
});



authRouter.post('/logout', async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,        // Set to true in production (HTTPS)
      sameSite: 'lax'
    });

    res.status(200).send("User logged out successfully");
  } catch (error) {
    res.status(400).send('Something went wrong during logout');
  }
});



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
          <h1>🚀 Backend Deployment Successful !💕</h1>
          <p class="status">Status: OK</p>
          <p>Build Time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});


module.exports = { authRouter }