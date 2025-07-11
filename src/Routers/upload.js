const express = require('express');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const dotenv = require('dotenv');
const { userAuth } = require('../middlewares/auth');

dotenv.config();
const uploadRouter = express.Router();

// AWS SDK v3 S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer config to keep file in memory (not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route: POST /upload
uploadRouter.post('/upload', userAuth, upload.single('file'), async (req, res) => {
  console.log("helllllo");
  
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const fileName = Date.now() + '-' + req.file.originalname;

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
       
        ContentType: req.file.mimetype
      }
    });

    const result = await upload.done();

    res.status(200).json({
      message: 'File uploaded successfully!',
      fileUrl: result.Location
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = uploadRouter;
