const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

const router = express.Router();
const upload = multer();

// POST /api/predict-emotion
router.post('/predict-emotion', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const formData = new FormData();
    formData.append('file', bufferStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post('http://localhost:8000/predict_file/', formData, {
      headers: formData.getHeaders()
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error forwarding image to Python server:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
