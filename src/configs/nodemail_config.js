

const nodemailer = require('nodemailer')


// Create a test account or replace with real credentials.
 const transporter = nodemailer.createTransport({
  host: process.env.BREVE_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVE_USER,
    pass: process.env.BREVE_KEY,
  },
});

module.exports = {transporter}