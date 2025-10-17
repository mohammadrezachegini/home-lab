# NodeJs-Ecommerce

## Project Overview
NodeJs-Ecommerce is a full-fledged web application designed for managing an e-commerce platform. It includes functionalities for product management, user authentication, order processing, and payment integration. The project follows best practices for structuring a Node.js application, using middleware for authentication and error handling, and integrating with a MongoDB database.

## Features
- **Product Management:** Add, retrieve, update, and delete products.
- **User Authentication:** Secure user login, registration, and profile management using JWT.
- **Order Processing:** Handle customer orders and manage order status.
- **Payment Integration:** Integrate with payment gateways for processing transactions.
- **File Uploads:** Manage product image uploads efficiently.
- **API Documentation:** Automatically generated API documentation using Swagger.
- **Middleware:** Robust middleware for request validation, authentication, and error handling.
- **Utility Functions:** Modular and reusable utility functions for common tasks.

## Requirements
- Node.js
- MongoDB

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/NodeJs-Ecommerce.git
    cd NodeJs-Ecommerce
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Create a `.env` file:**
    ```sh
    touch .env
    ```
    Fill in the `.env` file with the necessary environment variables:
    - `PORT`: The port number the server will run on.
    - `MONGO_URI`: The MongoDB connection string.
    - `JWT_SECRET`: Secret key for JWT authentication.
    - `PAYMENT_GATEWAY_KEY`: Key for the payment gateway integration.

4. **Start the application:**
    ```sh
    npm start
    ```

## Usage

- **Access the application:** Open your browser and navigate to `http://localhost:3000`.
- **API Documentation:** Navigate to `http://localhost:3000/api-docs` for Swagger-generated API documentation.

## Project Structure

### `app/`

#### `routers/`
Handles all routing mechanisms, organizing endpoints for various functionalities:
- **products/product.js:** Defines routes for product interactions, including listing, adding, updating, and deleting products.
- **users/auth.js:** Defines routes for user authentication and profile management.
- **orders/order.js:** Defines routes for managing customer orders.
- **payments/payment.js:** Defines routes for payment processing.

#### `models/`
Defines schemas and methods for interacting with MongoDB collections:
- **user.js:** Schema and model for user data, including fields for user information and methods for authentication.
- **product.js:** Schema and model for product data, including fields for product details and methods for data manipulation.
- **order.js:** Schema and model for order data, including fields for order details and methods for processing orders.
- **payment.js:** Schema and model for payment data, including fields for payment details and methods for handling transactions.

#### `http/`
Organizes HTTP interface handling, including middlewares and controllers:
- **middlewares/VerifyAccessToken.js:** Middleware to ensure incoming requests have valid access tokens for secure routes.
- **middlewares/checkErrors.js:** Middleware for capturing and handling validation and runtime errors.
- **validators/public.js:** Validation logic for ensuring incoming requests meet required criteria.
- **controllers/product/product.controller.js:** Contains business logic for managing products, including operations like adding, retrieving, updating, and deleting.
- **controllers/user/auth/auth.controller.js:** Contains business logic for user authentication, including registration, login, and profile management.
- **controllers/order/order.controller.js:** Contains business logic for managing orders, including creating, updating, and retrieving order details.
- **controllers/payment/payment.controller.js:** Contains business logic for handling payments, including processing transactions and managing payment statuses.

#### `modules/`
Provides utility functions and helpers that enhance functionality and modularity:
- **fileUploads.js:** Utility script for handling file uploads, managing storage locations, and ensuring correct file formats.

### `utils/`
Utility scripts that provide additional functionality:
- **constants.js:** Defines and exports application-wide constants for use throughout the project.
- **uploadFile.js:** Facilitates file uploads, ensuring proper handling and storage.
- **function.js:** Contains helper functions that can be reused across different modules.
- **multer.js:** Configures the middleware for handling multipart/form-data, enabling file uploads in API requests.
- **secret_key_generator.js:** Generates secret keys for use in JWT authentication, enhancing security.

### `server.js`
- **Server Configuration:** Configures the Express server settings, including middleware setup and route initialization.
- **Database Connection:** Establishes and manages connections to the MongoDB database, ensuring data persistence.
- **API Documentation:** Integrates Swagger to automatically generate API documentation based on the defined routes and schemas.
- **Route Management:** Centralizes route management through the `AllRoutes` module, ensuring all endpoints are registered and accessible.
- **Error Handling:** Implements standardized error responses, ensuring consistent error messaging across the application.

### `index.js`
Entry point script that initializes and bootstraps the application components, including setting up the server and connecting to the database.

## Environment Variables
Ensure the `.env` file includes:
- `PORT`: The port number the server will run on.
- `MONGO_URI`: The MongoDB connection string.
- `JWT_SECRET`: Secret key for JWT authentication.
- `PAYMENT_GATEWAY_KEY`: Key for the payment gateway integration.

## API Endpoints

### User Authentication
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: User login.

### Products
- `POST /products`: Add a new product.
- `GET /products`: Retrieve all products.
- `GET /products/:id`: Retrieve a specific product by ID.
- `PUT /products/:id`: Update a product by ID.
- `DELETE /products/:id`: Delete a product by ID.

### Orders
- `POST /orders`: Create a new order.
- `GET /orders`: Retrieve all orders.
- `GET /orders/:id`: Retrieve a specific order by ID.
- `PUT /orders/:id`: Update an order by ID.
- `DELETE /orders/:id`: Delete an order by ID.

### Payments
- `POST /payments`: Process a payment.
- `GET /payments`: Retrieve all payments.
- `GET /payments/:id`: Retrieve a specific payment by ID.

## Middleware
- **VerifyAccessToken.js:** Ensures secured requests have valid access tokens, protecting routes from unauthorized access.
- **checkErrors.js:** Middleware for capturing validation errors and runtime exceptions, providing structured error responses.

## Validation
- **public.js:** Contains validation logic for ensuring incoming requests meet required criteria, preventing malformed data from reaching controllers.

## Controllers
- **product.controller.js:** Contains business logic for managing products, including operations like adding, retrieving, updating, and deleting.
- **auth.controller.js:** Contains business logic for user authentication, including registration, login, and profile management.
- **order.controller.js:** Contains business logic for managing orders, including creating, updating, and retrieving order details.
- **payment.controller.js:** Contains business logic for handling payments, including processing transactions and managing payment statuses.

## Utility Scripts
- **constants.js:** Defines application-wide constants for use throughout the project.
- **uploadFile.js:** Utility for handling file uploads, managing storage locations, and ensuring correct file formats.
- **function.js:** Contains helper functions that can be reused across different modules.
- **multer.js:** Configures the middleware for handling multipart/form-data, enabling file uploads in API requests.
- **secret_key_generator.js:** Generates secret keys for use in JWT authentication, enhancing security.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Node.js Community
- Contributors and Supporters

## Troubleshooting
- **Database Connection Issues:** Ensure your `.env` file contains the correct database URL.
- **Runtime Issues:** Check logs for errors and ensure your environment variables are set correctly.

## Contact
For any issues or questions, please open an issue in the repository or contact the repository owner.

## Screenshots

### Main Screen
![Main Screen](path/to/screenshot1.png)

### Application Running
![Application Running](path/to/screenshot2.png)

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [JWT Documentation](https://jwt.io/introduction/)
- [Swagger Documentation](https://swagger.io/docs/)
- [Payment Gateway API Documentation](link_to_payment_gateway_docs)
