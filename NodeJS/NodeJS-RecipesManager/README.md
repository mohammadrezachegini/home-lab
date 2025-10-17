# NodeJS-RecipesManager

## Project Overview
NodeJS-RecipesManager is a robust web-based platform designed to manage culinary recipes. It offers APIs to add, retrieve, and display recipes, facilitating user interactions in a structured and secure manner.

## Features
- **Recipe Management:** Add, retrieve, update, and delete recipes.
- **User Authentication:** Secure user login and registration.
- **File Uploads:** Handle recipe image uploads.
- **API Documentation:** Auto-generated API documentation using Swagger.

## Requirements
- Node.js
- MongoDB

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/NodeJS-RecipesManager.git
    cd NodeJS-RecipesManager
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
- **API Documentation:** Navigate to `http://localhost:3000/api-docs` for Swagger-generated API documentation.

## Project Structure

### `app/`

#### `routers/`
Handles all routing mechanisms:
- **recipe/recipe.js:** Routes for recipe operations.
- **router.js:** Base routing configurations.
- **users/auth.js:** Authentication routes.

#### `models/`
Defines schemas and methods for data objects:
- **user.js:** User schema.
- **recipe.js:** Recipe schema.

#### `http/`
Organizes HTTP interface handling:
- **middlewares/VerifyAccessToken.js:** Middleware to ensure requests have valid access tokens.
- **middlewares/checkErrors.js:** Middleware for error handling.
- **validators/public.js:** Validation logic for incoming requests.
- **controllers/recipe/recipe.controller.js:** Manages recipe operations.
- **controllers/user/auth/auth.controller.js:** Manages authentication processes.

#### `modules/`
Utility scripts that enhance functionality:
- **fileUploads.js:** Handles file uploading mechanisms.

### `server.js`
- **Server Configuration:** Configures Express server settings and middleware.
- **Database Connection:** Manages MongoDB connections.
- **API Documentation:** Uses Swagger for API documentation.
- **Route Management:** Centralizes route management through the `AllRoutes` module.
- **Error Handling:** Standardizes error responses.

### `utils/`
Utility scripts:
- **constants.js:** Centralizes constant values.
- **uploadFile.js:** Facilitates file uploads.
- **function.js:** Contains reusable code blocks.
- **express-fileUpload.js:** Configures file upload middleware.
- **secret_key_generator.js:** Generates secret keys for security.

### `index.js`
Entry point script that initializes and bootstraps the application components.

## Environment Variables
Ensure the `.env` file includes:
- `PORT`: The port number the server will run on.
- `MONGO_URI`: The MongoDB connection string.
- `JWT_SECRET`: Secret key for JWT authentication.

## API Endpoints

### User Authentication
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: User login.

### Recipes
- `POST /recipes`: Add a new recipe.
- `GET /recipes`: Retrieve all recipes.
- `GET /recipes/:id`: Retrieve a specific recipe by ID.
- `PUT /recipes/:id`: Update a recipe by ID.
- `DELETE /recipes/:id`: Delete a recipe by ID.

## Middleware
- **VerifyAccessToken.js:** Ensures secured requests have valid access tokens.
- **checkErrors.js:** Handles validation and runtime errors.

## Validation
- **public.js:** Validates user input for authentication and recipe operations.

## Controllers
- **recipe.controller.js:** Contains logic for managing recipes.
- **auth.controller.js:** Contains logic for user authentication.

## Utility Scripts
- **constants.js:** Defines application-wide constants.
- **uploadFile.js:** Utility for handling file uploads.
- **function.js:** Contains helper functions.
- **express-fileUpload.js:** Configures the middleware for handling multipart/form-data.
- **secret_key_generator.js:** Script to generate secret keys for JWT.

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
