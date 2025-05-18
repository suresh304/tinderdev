// /routes/upload.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {userAuth} = require('../middlewares/auth')

// const authMiddleware = require('../middleware/authMiddleware');

const uploadRouter = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  },
});

// POST /api/upload
uploadRouter.post('/', userAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ message: "Upload successful", fileUrl });
});

module.exports = uploadRouter;
