const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Kubernetes', 'CI/CD', 'Monitoring', 'GitOps', 'Docker', 'Infrastructure'],
    required: true
  },
  tags: [String],
  readTime: {
    type: Number,
    default: 5
  },
  published: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);