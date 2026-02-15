const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const articleRoutes = require('./routes/articles');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/devops-blog';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/articles', articleRoutes);

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB:', MONGODB_URL);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });