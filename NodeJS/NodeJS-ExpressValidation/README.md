# NodeJS-ExpressValidation

## Project Overview
This project is a Node.js backend application using Express.js. It implements user authentication, including login and registration functionalities, with comprehensive request validation and custom error handling. The system validates user input on authentication routes and provides detailed feedback on validation errors.

## Features
- **User Authentication:** Supports login and registration functionalities with input validation.
- **Express Validation:** Uses `express-validation` to validate request bodies against predefined Joi schemas, ensuring that received data meets the application's requirements.
- **Custom Error Handling:** Implements a custom error handling middleware to catch and format errors, including those from the validation process.
- **Validation Error Mapper:** Utilizes a custom function to map validation errors to a more readable and user-friendly format.

## Requirements
- Node.js

## Installation

1. **Clone the repository:**
    ```sh
    git clone git@github.com:mohammadrezachegini/NodeJS-ExpressValidation.git
    cd NodeJS-ExpressValidation
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Create a `.env` file:**
    ```sh
    touch .env
    ```
    Fill in the `.env` file with the necessary environment variables (e.g., database URL, JWT secret).

4. **Start the application:**
    ```sh
    npm start
    ```

## Usage

### API Endpoints

#### User Registration
- **Endpoint:** `POST /register`
- **Description:** Registers a new user with validation for username, email, and password.
- **Request Body:**
    ```json
    {
        "username": "exampleUser",
        "email": "user@example.com",
        "password": "securePassword"
    }
    ```

#### User Login
- **Endpoint:** `POST /login`
- **Description:** Authenticates a user with validation for email and password.
- **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "securePassword"
    }
    ```

## Project Structure

### `app.js`
The main application file that sets up the Express server, middleware, and routes.

### `validators/`
Contains custom validation logic for user registration and login.
- **userValidator.js:** Defines validation rules and logic for the user registration and login endpoints.

### `util/`
Utility functions for the application.
- **errorHandler.js:** Custom error handling middleware that captures and formats errors.
- **responseHandler.js:** Handles and formats responses to the client.

### `package.json`
Metadata for the Node.js project, including dependencies, scripts, and other configurations.

## Environment Variables
Ensure the `.env` file includes:
- `PORT`: The port number the server will run on.
- `DB_URL`: The database connection string.
- `JWT_SECRET`: Secret key for JWT authentication.

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

### Registration Endpoint
![Registration Endpoint](path/to/screenshot1.png)

### Error Handling
![Error Handling](path/to/screenshot2.png)

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
- [Joi Documentation](https://joi.dev/)
- [JWT Documentation](https://jwt.io/introduction/)
