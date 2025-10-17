# Product Management System

This segment of the project introduces a lightweight product management system built on Node.js, utilizing the native HTTP module for server operations. It supports CRUD (Create, Read, Update, Delete) operations for products, interacting with a MongoDB database for persistent storage. The implementation showcases handling HTTP requests and responses, managing database connections, and simple error handling without the use of Express.js.

## Key Components

### Server Setup (`server.js`)

- Initializes a basic HTTP server handling routes for products and incorporating error responses for undefined routes.
- Utilizes `products.controllers.js` for handling requests related to products, directing them based on the HTTP method and URL.

### Database Connection (`mongo-connection.js`)

- Establishes a connection to MongoDB using the `MongoClient` from the `mongodb` package.
- Encapsulates connection logic within a class to manage a single connection instance throughout the application lifecycle.

### Product Model (`products.model.js`)

- Defines functions for interacting with the `product` collection in MongoDB, including finding all products, finding a product by ID, creating, updating, and removing products.
- Leverages JavaScript `Promises` for asynchronous operations, ensuring non-blocking database interactions.

### Product Controllers (`products.controllers.js`)

- Contains the logic for handling requests to different product-related endpoints, performing actions such as retrieving all products, retrieving a single product by ID, creating a new product, updating an existing product, and deleting a product.
- Parses incoming request bodies for POST and PUT requests to construct and modify products, respectively.

### Error Handling (`errorHandler.controller.js`)

- Implements a basic 404 Not Found response for requests to undefined routes, ensuring a JSON response format.

### Products Data (`products.json`)

- A sample JSON file containing an array of product objects, showcasing a potential structure for products data. (Note: This file acts as a reference for the structure but is superseded by database operations in this context.)

## Features

- **CRUD Operations**: Full support for creating, reading, updating, and deleting products within a MongoDB database.
- **MongoDB Integration**: Utilizes MongoDB for storing and querying product data, demonstrating basic NoSQL database interactions in Node.js.
- **Error Handling**: Provides a simplistic approach to handling undefined routes, returning a 404 status code with a JSON response.
- **Pure Node.js Implementation**: Operates without Express.js, offering a clear view of handling HTTP operations and asynchronous database interactions in Node.js.

## Conclusion

This product management system exemplifies a minimalistic approach to building RESTful APIs with Node.js and MongoDB. It serves as a practical example of managing database connections, executing CRUD operations, and structuring application logic in a Node.js environment without external frameworks like Express.js.
