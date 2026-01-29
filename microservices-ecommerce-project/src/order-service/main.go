package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ============================================================================
// STRUCTS (Data Models)
// ============================================================================

type Order struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	ProductID  int       `json:"product_id"`
	Quantity   int       `json:"quantity"`
	TotalPrice float64   `json:"total_price"`
	Status     string    `json:"status"`
	OrderDate  time.Time `json:"order_date"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateOrderRequest struct {
	UserID     int     `json:"user_id" binding:"required"`
	ProductID  int     `json:"product_id" binding:"required"`
	Quantity   int     `json:"quantity" binding:"required,min=1"`
	TotalPrice float64 `json:"total_price" binding:"required,min=0"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
	Database  string `json:"database"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Count   int         `json:"count,omitempty"`
}

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

var (
	db *sql.DB

	// Prometheus metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)
)

// ============================================================================
// INITIALIZATION
// ============================================================================

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
}

func initDB() error {
	// Load environment variables
	godotenv.Load()

	// Get database configuration
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "ecommerce")

	// Create connection string
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	// Open database connection
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	// Test connection
	if err = db.Ping(); err != nil {
		return err
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ Connected to PostgreSQL database")
	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

func prometheusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())

		httpRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// ============================================================================
// HANDLERS
// ============================================================================

func healthCheck(c *gin.Context) {
	// Test database connection
	err := db.Ping()
	
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, HealthResponse{
			Status:    "unhealthy",
			Service:   "order-service",
			Timestamp: time.Now().Format(time.RFC3339),
			Database:  "disconnected",
		})
		return
	}

	c.JSON(http.StatusOK, HealthResponse{
		Status:    "healthy",
		Service:   "order-service",
		Timestamp: time.Now().Format(time.RFC3339),
		Database:  "connected",
	})
}

func getOrders(c *gin.Context) {
	// Query parameters for filtering
	userID := c.Query("user_id")
	status := c.Query("status")
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	// Build query
	query := `
		SELECT id, user_id, product_id, quantity, total_price, status, 
		       order_date, created_at, updated_at
		FROM orders
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	// Add filters
	if userID != "" {
		query += fmt.Sprintf(" AND user_id = $%d", argCount)
		args = append(args, userID)
		argCount++
	}

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, status)
		argCount++
	}

	// Add ordering and pagination
	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to fetch orders: %v", err),
		})
		return
	}
	defer rows.Close()

	// Parse results
	orders := []Order{}
	for rows.Next() {
		var order Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.ProductID,
			&order.Quantity, &order.TotalPrice, &order.Status,
			&order.OrderDate, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to parse order: %v", err),
			})
			return
		}
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Count:   len(orders),
		Data:    orders,
	})
}

func getOrder(c *gin.Context) {
	id := c.Param("id")

	var order Order
	err := db.QueryRow(`
		SELECT id, user_id, product_id, quantity, total_price, status,
		       order_date, created_at, updated_at
		FROM orders
		WHERE id = $1
	`, id).Scan(
		&order.ID, &order.UserID, &order.ProductID,
		&order.Quantity, &order.TotalPrice, &order.Status,
		&order.OrderDate, &order.CreatedAt, &order.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "Order not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to fetch order: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    order,
	})
}

func createOrder(c *gin.Context) {
	var req CreateOrderRequest
	
	// Validate request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	// Insert order
	var order Order
	err := db.QueryRow(`
		INSERT INTO orders (user_id, product_id, quantity, total_price, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id, user_id, product_id, quantity, total_price, status,
		          order_date, created_at, updated_at
	`, req.UserID, req.ProductID, req.Quantity, req.TotalPrice).Scan(
		&order.ID, &order.UserID, &order.ProductID,
		&order.Quantity, &order.TotalPrice, &order.Status,
		&order.OrderDate, &order.CreatedAt, &order.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to create order: %v", err),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Success: true,
		Message: "Order created successfully",
		Data:    order,
	})
}

func updateOrderStatus(c *gin.Context) {
	id := c.Param("id")

	var req UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	// Update order status
	result, err := db.Exec(`
		UPDATE orders
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`, req.Status, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to update order: %v", err),
		})
		return
	}

	// Check if order exists
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Order status updated successfully",
	})
}

func deleteOrder(c *gin.Context) {
	id := c.Param("id")

	result, err := db.Exec("DELETE FROM orders WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to delete order: %v", err),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Order deleted successfully",
	})
}

func getUserOrders(c *gin.Context) {
	userID := c.Param("user_id")

	rows, err := db.Query(`
		SELECT id, user_id, product_id, quantity, total_price, status,
		       order_date, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to fetch user orders: %v", err),
		})
		return
	}
	defer rows.Close()

	orders := []Order{}
	for rows.Next() {
		var order Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.ProductID,
			&order.Quantity, &order.TotalPrice, &order.Status,
			&order.OrderDate, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to parse order: %v", err),
			})
			return
		}
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Count:   len(orders),
		Data:    orders,
	})
}

// ============================================================================
// MAIN
// ============================================================================

func main() {
	// Initialize database
	if err := initDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.Default()

	// Apply middleware
	router.Use(corsMiddleware())
	router.Use(prometheusMiddleware())

	// Health and metrics endpoints
	router.GET("/health", healthCheck)
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Order endpoints
	router.GET("/api/orders", getOrders)
	router.GET("/api/orders/:id", getOrder)
	router.POST("/api/orders", createOrder)
	router.PUT("/api/orders/:id/status", updateOrderStatus)
	router.DELETE("/api/orders/:id", deleteOrder)
	router.GET("/api/orders/user/:user_id", getUserOrders)

	// Start server
	port := getEnv("PORT", "8003")
	
	fmt.Println("============================================================")
	fmt.Println("🚀 Order Service running on port", port)
	fmt.Println("📊 Metrics: http://localhost:" + port + "/metrics")
	fmt.Println("❤️  Health: http://localhost:" + port + "/health")
	fmt.Println("🔗 API: http://localhost:" + port + "/api/orders")
	fmt.Println("🌍 Environment:", getEnv("ENVIRONMENT", "development"))
	fmt.Println("============================================================")

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}