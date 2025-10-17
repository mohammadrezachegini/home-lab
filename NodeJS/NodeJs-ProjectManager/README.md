# NodeJs-ProjectManager

## Project Overview
NodeJs-ProjectManager is a comprehensive web application designed for managing projects, teams, and user roles through a structured API. It facilitates project management operations, user authentication, and team collaboration.

## Core Components

### `app/`
Central to the application, hosting all backend logic, models, controllers, and routes.

#### `routers/`
Handles API routing for user, team, and project management:
- **teamRouter.js:** Manages team functionalities.
- **userRouter.js:** Handles user profiles and management.
- **authRouter.js:** Supports authentication processes.
- **projectRouter.js:** Facilitates project operations.

#### `models/`
Defines Mongoose models for database interactions:
- **teamModel.js:** Schema for team data.
- **userModel.js:** Schema for user data.
- **projectModel.js:** Schema for project data.

#### `http/`
Organizes HTTP interactions:
- **middlewares/autoLogin.js:** Middleware for automatic login session handling.
- **middlewares/CheckErrors.js:** Middleware for error handling.
- **validations/validation.js:** Ensures data integrity before processing API requests.
- **controllers/projectController.js:** Business logic for project management.
- **controllers/userController.js:** Business logic for user management.
- **controllers/teamController.js:** Business logic for team management.
- **controllers/authController.js:** Business logic for authentication.

#### `modules/`
Utility scripts that enhance functionality:
- **fileUploads.js:** Handles file uploading mechanisms.

### `public/`
Contains static files used in the application's frontend.

### `index.js`
Entry point for the application that sets up and starts the server.

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/NodeJs-ProjectManager.git
    cd NodeJs-ProjectManager
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

- **Access the application:** Open your browser and navigate to `http://localhost:3000`.
- **API Documentation:** The API routes and their usage can be found in the `routers/` directory.

## Project Structure

### `app/routers/`
- **teamRouter.js:** Handles team-related routes.
- **userRouter.js:** Manages user-related routes.
- **authRouter.js:** Manages authentication routes.
- **projectRouter.js:** Handles project-related routes.

### `app/models/`
- **teamModel.js:** Mongoose schema and model for team data.
- **userModel.js:** Mongoose schema and model for user data.
- **projectModel.js:** Mongoose schema and model for project data.

### `app/http/`
- **middlewares/autoLogin.js:** Middleware for automatic login session handling.
- **middlewares/CheckErrors.js:** Middleware for error handling.
- **validations/validation.js:** Validation logic for incoming requests.
- **controllers/projectController.js:** Business logic for project management.
- **controllers/userController.js:** Business logic for user management.
- **controllers/teamController.js:** Business logic for team management.
- **controllers/authController.js:** Business logic for authentication.

### `app/modules/`
- **fileUploads.js:** Utility script for handling file uploads.

### `public/`
- Static files for the frontend.

### `index.js`
- The main entry point of the application, setting up the server and initializing routes.

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
