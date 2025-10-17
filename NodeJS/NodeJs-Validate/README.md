# NodeJs-Validate

## Project Overview
NodeJs-Validate is a backend application developed with Express.js. It features user authentication, including registration and error handling. Custom validation is implemented for user registration, ensuring data integrity and proper user feedback.

## Features
- **User Registration:** Endpoint to register users with validation for username, email, and role.
- **Error Handling:** Custom error handling for not found routes and internal server errors, providing clear and concise JSON responses for debugging and user information.

## Requirements
- Node.js

## Installation

1. **Clone the repository:**
    ```sh
    git clone git@github.com:mohammadrezachegini/NodeJs-Validate.git
    cd NodeJs-Validate
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
- **Description:** Registers a new user with validation for username, email, and role.
- **Request Body:**
    ```json
    {
        "username": "exampleUser",
        "email": "user@example.com",
        "role": "admin"
    }
    ```

### Error Handling
- **Not Found Routes:** Returns a 404 status code with a JSON message indicating the route is not found.
- **Internal Server Errors:** Returns a 500 status code with a JSON message providing error details for debugging.

## Project Structure

### `app.js`
The main application file that sets up the Express server, middleware, and routes.

### `validators/`
Contains custom validation logic for user registration.
- **userValidator.js:** Defines validation rules and logic for the user registration endpoint.

### `util/`
Utility functions for the application.
- **errorHandler.js:** Custom error handling middleware.
- **responseHandler.js:** Handles and formats responses to the client.

### `package.json`
Metadata for the Node.js project, including dependencies, scripts, and other configurations.

### Environment Variables
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
- [JWT Documentation](https://jwt.io/introduction/)
