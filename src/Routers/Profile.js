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
    const userId = req.user.id;

    const { rows } = await pool.query('SELECT id, first_name, email_id, about FROM users WHERE id = $1', [userId]);

    if (rows.length === 0) {
      return res.status(404).send('No user found');
    }

    res.status(200).json(rows[0]);
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
    const { name, about,age, } = req.body;

    const { rows } = await pool.query(
      'UPDATE users SET name = $1, bio = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, bio',
      [name, about, age]
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
