const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFileToAzure } = require('../utils/azureUploader');
const { userAuth } = require('../middlewares/auth');

const uploadRouter = express.Router();

// Temp upload dir
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
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
uploadRouter.post('/', userAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const localFilePath = req.file.path;
    const blobName = req.file.filename;

    const azureFileUrl = await uploadFileToAzure(localFilePath, blobName);

    // Delete local temp file
    fs.unlinkSync(localFilePath);

    res.json({ message: "Upload successful", fileUrl: azureFileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = uploadRouter;
