# NodeJS-Joi

## Project Overview
This project showcases a backend application built with Express.js, featuring user authentication with robust request validation using Joi, and custom error handling. The primary focus is to ensure that all incoming requests conform to specified schemas, providing a secure and reliable API.

## Features
- **User Authentication:** Implementation of login and registration functionalities with extensive input validation.
- **Joi Validation:** Utilizes Joi for validating request bodies, ensuring the data conforms to specified schemas for login and registration endpoints.
- **Custom Error Handling:** Incorporates custom error handling middleware to manage and format errors, including validation errors, for client-friendly responses.
- **Validation Error Mapping:** Employs a validation error mapper to transform Joi validation errors into a more readable format.

## Requirements
- Node.js

## Installation

1. **Clone the repository:**
    ```sh
    git clone git@github.com:mohammadrezachegini/NodeJS-Joi.git
    cd NodeJS-Joi
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
