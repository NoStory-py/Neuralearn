const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/simple-auth')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Middleware
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST'],
  credentials: true
}));

// Routes
app.use('/api', authRoutes);
app.use('/api', predictRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
