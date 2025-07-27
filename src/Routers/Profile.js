const express = require('express');
const profileRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { validateProfileEdit } = require('../utils/validate');
const { sendMail } = require('../utils/sendmail');

// PostgreSQL pool setup (you can also import from a config file)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or define individual config keys
});

// GET profile
profileRouter.get('/profile/view', userAuth, async (req, res) => {
  try {
    const user = req.user;

    if(user){
      res.status(200).json(user)
    }else{
      res.status(401).json(
        {message:"no user exist"}
      )
    }

   ;
  } catch (error) {
    res.status(400).send('Something went wrong fetching profile');
  }
});

// PATCH profile
profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
  try {
    if (!validateProfileEdit(req)) {
      throw new Error('Invalid edit request');
    }

    const userId = req.user.id;
    const { first_name,last_name, about,age,photo_url } = req.body;

    const { rows } = await pool.query(
      'UPDATE users SET first_name = $1, last_name=$2,about = $3, photo_url = $4,age = $5,updated_at = NOW() WHERE id = $6 RETURNING id, first_name, email_id, about',
      [first_name, last_name,about, photo_url,age,userId]
    );

    if (rows.length === 0) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

module.exports = { profileRouter };
