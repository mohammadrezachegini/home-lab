# Blog Application Backend

This project forms the backend of a blog application, leveraging Node.js, Express.js, and MongoDB. It supports user registration and login, creating and managing blog posts, and categorizing posts. Below are the details of the project's structure and functionalities.

## Project Structure

### Models

- **User Model (`User.js`)**: Defines the schema for users, including username, email, password, and profile picture.

- **Post Model (`Post.js`)**: Outlines the schema for blog posts, detailing the title, description, photo, username (author), and categories.

- **Category Model (`Category.js`)**: Specifies the schema for categories, simply comprising a name for each category.

### Routes

- **Authentication (`Auth.js`)**: Handles user registration and login, employing bcrypt for password hashing and validation.

- **User Management (`Users.js`)**: Supports updating and deleting user profiles, with additional functionality to retrieve user data by ID. Passwords are rehashed upon update if changed.

- **Post Management (`Posts.js`)**: Enables creating, updating, deleting, and fetching posts. Posts can be filtered by username or category through query parameters.

- **Category Management (`Categories.js`)**: Allows for adding new categories and retrieving all existing categories.

### Main Server File (`index.js`)

- Initializes and runs the Express.js server, setting up middleware for JSON parsing and routing.
- Establishes the MongoDB connection using Mongoose.
- Includes a route for file uploads using multer, demonstrating an approach to handling media in posts.

## Features

- **Secure Authentication**: Utilizes bcrypt for hashing and checking passwords, ensuring secure user authentication.
- **CRUD Operations**: Supports Create, Read, Update, and Delete operations for both posts and user profiles.
- **Dynamic Content Filtering**: Fetches posts based on specific criteria like username or category, allowing for dynamic content display.
- **File Upload**: Implements a basic file upload mechanism for adding photos to posts.

## Conclusion

This backend application provides a solid foundation for a blog platform, emphasizing security in user authentication, flexibility in content management, and simplicity in category handling. The modular structure facilitates easy expansion and integration with frontend technologies to create a full-stack application.
