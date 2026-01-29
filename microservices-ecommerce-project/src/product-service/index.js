const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const promClient = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// PROMETHEUS METRICS
// ============================================================================

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Metrics middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
};

app.use(metricsMiddleware);

// ============================================================================
// HEALTH & METRICS ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      service: 'product-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'product-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ============================================================================
// PRODUCT ENDPOINTS
// ============================================================================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    // Filter by category
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    // Search by name
    if (search) {
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    
    // Validation
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      });
    }
    
    if (price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be positive'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, stock || 0, category, image_url]
    );
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, image_url } = req.body;
    
    // Check if product exists
    const checkResult = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be positive'
      });
    }
    
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock must be non-negative'
      });
    }
    
    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category = COALESCE($5, category),
           image_url = COALESCE($6, image_url),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, price, stock, category, image_url, id]
    );
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// Get product categories
app.get('/api/products/categories/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('════════════════════════════════════════════════════════');
  console.log(`🚀 Product Service running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api/products`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('════════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
