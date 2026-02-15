const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// GET all articles
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;

    const articles = await Article.find(filter)
      .select('-content')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Article.countDocuments(filter);

    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single article by slug
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      published: true
    });

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET categories list
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Article.distinct('category', { published: true });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;