const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const promClient = require('prom-client');
require('dotenv').config();

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 8005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
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

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================================================
// PROMETHEUS METRICS
// ============================================================================

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

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

const inventoryStockGauge = new promClient.Gauge({
  name: 'inventory_stock_total',
  help: 'Total stock across all warehouses',
  labelNames: ['product_id', 'warehouse'],
  registers: [register]
});

const inventoryOperationsTotal = new promClient.Counter({
  name: 'inventory_operations_total',
  help: 'Total inventory operations',
  labelNames: ['operation_type', 'warehouse'],
  registers: [register]
});

// ============================================================================
// METRICS MIDDLEWARE
// ============================================================================

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
// HELPER FUNCTIONS
// ============================================================================

async function updateStockMetrics() {
  try {
    const result = await pool.query(`
      SELECT product_id, warehouse_location, quantity
      FROM inventory
    `);
    
    // Clear old metrics
    inventoryStockGauge.reset();
    
    // Set new metrics
    result.rows.forEach(row => {
      inventoryStockGauge.set(
        { product_id: row.product_id, warehouse: row.warehouse_location },
        row.quantity
      );
    });
  } catch (error) {
    console.error('Error updating stock metrics:', error);
  }
}

// ============================================================================
// HEALTH & METRICS ENDPOINTS
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      service: 'inventory-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'inventory-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/metrics', async (req, res) => {
  await updateStockMetrics();
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

// Get all inventory records
app.get('/api/inventory', async (req, res) => {
  try {
    const { product_id, warehouse, low_stock } = req.query;
    
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (product_id) {
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
      paramCount++;
    }
    
    if (warehouse) {
      query += ` AND warehouse_location = $${paramCount}`;
      params.push(warehouse);
      paramCount++;
    }
    
    if (low_stock === 'true') {
      query += ' AND quantity < 10';
    }
    
    query += ' ORDER BY product_id, warehouse_location';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    });
  }
});

// Get inventory for specific product
app.get('/api/inventory/product/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM inventory WHERE product_id = $1',
      [product_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No inventory found for this product'
      });
    }
    
    // Calculate total stock across all warehouses
    const totalStock = result.rows.reduce((sum, row) => sum + row.quantity, 0);
    const totalReserved = result.rows.reduce((sum, row) => sum + row.reserved_quantity, 0);
    
    res.json({
      success: true,
      product_id: parseInt(product_id),
      total_stock: totalStock,
      total_reserved: totalReserved,
      available: totalStock - totalReserved,
      warehouses: result.rows
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product inventory',
      message: error.message
    });
  }
});

// Get inventory by ID
app.get('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM inventory WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    });
  }
});

// Create inventory record
app.post('/api/inventory', async (req, res) => {
  try {
    const { product_id, warehouse_location, quantity } = req.body;
    
    // Validation
    if (!product_id || !warehouse_location || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'product_id, warehouse_location, and quantity are required'
      });
    }
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be non-negative'
      });
    }
    
    // Check if record already exists
    const existing = await pool.query(
      'SELECT id FROM inventory WHERE product_id = $1 AND warehouse_location = $2',
      [product_id, warehouse_location]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Inventory record already exists for this product and warehouse'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO inventory (product_id, warehouse_location, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [product_id, warehouse_location, quantity]
    );
    
    // Track operation
    inventoryOperationsTotal.inc({
      operation_type: 'create',
      warehouse: warehouse_location
    });
    
    res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory',
      message: error.message
    });
  }
});

// Update inventory quantity (restock)
app.put('/api/inventory/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }
    
    const result = await pool.query(
      `UPDATE inventory
       SET quantity = quantity + $1,
           last_restocked = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    // Track operation
    inventoryOperationsTotal.inc({
      operation_type: 'restock',
      warehouse: result.rows[0].warehouse_location
    });
    
    res.json({
      success: true,
      message: `Added ${quantity} units to inventory`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error restocking inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restock inventory',
      message: error.message
    });
  }
});

// Reserve stock for order
app.post('/api/inventory/:id/reserve', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }
    
    // Check available quantity
    const checkResult = await pool.query(
      'SELECT quantity, reserved_quantity FROM inventory WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    const available = checkResult.rows[0].quantity - checkResult.rows[0].reserved_quantity;
    
    if (available < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock',
        available: available,
        requested: quantity
      });
    }
    
    // Reserve stock
    const result = await pool.query(
      `UPDATE inventory
       SET reserved_quantity = reserved_quantity + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    
    // Track operation
    inventoryOperationsTotal.inc({
      operation_type: 'reserve',
      warehouse: result.rows[0].warehouse_location
    });
    
    res.json({
      success: true,
      message: `Reserved ${quantity} units`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error reserving inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve inventory',
      message: error.message
    });
  }
});

// Release reserved stock
app.post('/api/inventory/:id/release', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }
    
    const result = await pool.query(
      `UPDATE inventory
       SET reserved_quantity = GREATEST(reserved_quantity - $1, 0),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    // Track operation
    inventoryOperationsTotal.inc({
      operation_type: 'release',
      warehouse: result.rows[0].warehouse_location
    });
    
    res.json({
      success: true,
      message: `Released ${quantity} units`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error releasing inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release inventory',
      message: error.message
    });
  }
});

// Fulfill order (reduce actual stock)
app.post('/api/inventory/:id/fulfill', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }
    
    const result = await pool.query(
      `UPDATE inventory
       SET quantity = GREATEST(quantity - $1, 0),
           reserved_quantity = GREATEST(reserved_quantity - $1, 0),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    // Track operation
    inventoryOperationsTotal.inc({
      operation_type: 'fulfill',
      warehouse: result.rows[0].warehouse_location
    });
    
    res.json({
      success: true,
      message: `Fulfilled order: ${quantity} units`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fulfilling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fulfill order',
      message: error.message
    });
  }
});

// Get low stock items
app.get('/api/inventory/alerts/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    
    const result = await pool.query(
      `SELECT i.*, p.name as product_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.quantity < $1
       ORDER BY i.quantity ASC`,
      [threshold]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      threshold: parseInt(threshold),
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock items',
      message: error.message
    });
  }
});

// Delete inventory record
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM inventory WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Inventory record deleted successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLERS
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
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('════════════════════════════════════════════════════════');
  console.log(`🚀 Inventory Service running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api/inventory`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('════════════════════════════════════════════════════════');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

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