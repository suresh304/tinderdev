// nodemail_config.js
import nodemailer from 'nodemailer';

// const nodemailer = require('nodemailer')


// Create a test account or replace with real credentials.
export const transporter = nodemailer.createTransport({
  host: process.env.BREVE_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVE_USER,
    pass: process.env.BREVE_KEY,
  },
});