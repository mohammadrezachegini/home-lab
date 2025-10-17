# Node.js Projects Collection

A comprehensive collection of Node.js applications showcasing modern web development practices, MERN stack implementations, and various backend technologies.

## Table of Contents

- [Overview](#overview)
- [Projects](#projects)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Overview

This repository contains multiple Node.js projects demonstrating different aspects of backend development, including REST APIs, authentication systems, file handling, database operations, and full-stack MERN applications.

## Projects

### 1. MERN Book Management System
A full-stack application for managing books with React frontend and Node.js backend.

**Features:**
- CRUD operations for books
- React-based user interface
- MongoDB integration
- RESTful API endpoints

**Tech Stack:** React, Node.js, Express, MongoDB, Bootstrap

### 2. NodeJS E-commerce Platform
A comprehensive e-commerce backend with advanced features.

**Features:**
- User authentication with JWT
- Product management
- Order processing
- Role-based access control (RBAC)
- File upload handling
- API documentation with Swagger

**Tech Stack:** Node.js, Express, MongoDB, JWT, Multer, Swagger

### 3. Blog API System
A robust blog management system with user authentication.

**Features:**
- User registration and login
- Blog post CRUD operations
- Comment system
- Category management
- File upload for images

**Tech Stack:** Node.js, Express, MongoDB, bcrypt

### 4. Papua Coffee Management
A specialized application for coffee shop management.

**Features:**
- Coffee product management
- User authentication
- Image upload for products
- RESTful API design

**Tech Stack:** Node.js, Express, MongoDB, Swagger

### 5. Project Management System
A team collaboration and project management platform.

**Features:**
- User and team management
- Project creation and tracking
- Role-based permissions
- File upload capabilities

**Tech Stack:** Node.js, Express, MongoDB, JWT

### 6. Recipe Management System
A platform for managing and sharing recipes.

**Features:**
- Recipe CRUD operations
- User authentication
- Image upload for recipes
- Search functionality

**Tech Stack:** Node.js, Express, MongoDB, OpenAI integration

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT (JSON Web Tokens)** - Authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### File Handling
- **Multer** - File upload middleware
- **express-fileupload** - Alternative file upload

### Validation
- **Joi** - Data validation
- **express-validation** - Request validation

### Documentation
- **Swagger** - API documentation
- **swagger-ui-express** - Swagger UI integration

### Frontend (MERN Projects)
- **React** - Frontend library
- **Bootstrap** - CSS framework
- **Axios** - HTTP client

### Development Tools
- **Nodemon** - Development server
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nodejs-projects.git
cd nodejs-projects
```

2. **Navigate to specific project**
```bash
cd project-name
```

3. **Install dependencies**
```bash
npm install
```

4. **Set up environment variables**
Create a `.env` file in the project root:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your-jwt-secret-key
```

5. **Start the application**
```bash
npm start
# or for development
npm run dev
```

## Usage

### API Endpoints

Most projects include RESTful API endpoints following this pattern:

```
GET    /api/resource      - Get all items
GET    /api/resource/:id  - Get single item
POST   /api/resource      - Create new item
PUT    /api/resource/:id  - Update item
DELETE /api/resource/:id  - Delete item
```

### Authentication

Protected routes require authentication headers:
```
Authorization: Bearer your-jwt-token
```

### File Uploads

File upload endpoints accept multipart/form-data:
```javascript
const formData = new FormData();
formData.append('image', file);
```

## Project Structure

```
project-name/
├── app/
│   ├── controllers/     # Business logic
│   ├── models/         # Database models
│   ├── routers/        # Route definitions
│   ├── middleware/     # Custom middleware
│   └── validations/    # Input validation
├── utils/              # Utility functions
├── public/             # Static files
├── .env               # Environment variables
├── package.json       # Dependencies
└── server.js          # Entry point
```

## Features

### Core Features
- **RESTful APIs** - Well-structured API endpoints
- **Authentication** - JWT-based user authentication
- **Authorization** - Role-based access control
- **Validation** - Input validation and sanitization
- **Error Handling** - Comprehensive error management
- **File Upload** - Image and file upload capabilities

### Advanced Features
- **API Documentation** - Swagger/OpenAPI documentation
- **Database Integration** - MongoDB with Mongoose ODM
- **Security** - Password hashing, JWT tokens
- **Logging** - Request logging with Morgan
- **CORS** - Cross-origin resource sharing
- **Pagination** - Efficient data pagination
