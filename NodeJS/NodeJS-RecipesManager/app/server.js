// Importing required modules and libraries
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const createError = require('http-errors');
const swaggerUI = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const cors = require('cors');
const {AllRoutes} = require('../app/routers/router'); // Assuming AllRoutes is an Express router containing all route definitions

// Defining the Application class
module.exports = class Application {

    // Private fields for the express app instance, database URI, and port number
    #app = express();
    #DB_URI;
    #PORT;

    // Constructor method to initialize the Application instance
    constructor(PORT, DB_URI) {
        this.#PORT = PORT;
        this.#DB_URI = DB_URI;
        this.configApplication(); // Configuring the Express application
        this.connectToMongoose(); // Connecting to MongoDB using Mongoose
        this.createServer(); // Creating an HTTP server
        this.createRoutes(); // Creating routes for the application
        this.errorHandling(); // Handling errors in the application
    }

    // Method to configure the Express application
    configApplication(){
        this.#app.use(cors()); // Enable CORS for cross-origin requests
        this.#app.use(morgan('dev')); // Logging HTTP requests in development mode
        this.#app.use(express.json()); // Parse JSON bodies of incoming requests
        this.#app.use(express.urlencoded({extended: true})); // Parse URL-encoded bodies of incoming requests
        this.#app.use(express.static(path.join(__dirname, "..", "public"))); // Serve static files from the 'public' directory
        // Set up Swagger documentation endpoint at '/api-doc'
        this.#app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerJSDoc({
            swaggerDefinition: {
                info: {
                    title: "CSIS 4495 Project",
                    version: "2.0.0",
                    description: "CSIS 4495 Project",
                    contact: {
                        name: "Reza Chegini and Azin mobed",
                        url: "https://idonthave.com",
                        email: "mr.goodarzvand.chegini@gmail.com - azinmobed@gmail.com"
                    }
                },
                servers: [
                    {
                        url: "http://localhost:3000"
                    }
                ]
            },
            apis:["./app/routers/**/*.js"]
        })));
    }

    // Method to create an HTTP server
    createServer(){
        const http = require('http');
        // Create an HTTP server using the Express app and listen on the specified port
        http.createServer(this.#app).listen(this.#PORT, () => {
            console.log(`Server is running on port ${this.#PORT}`);
        })
    }

    // Method to connect to MongoDB using Mongoose
    connectToMongoose(){
        // Set Mongoose option to strict query mode
        mongoose.set("strictQuery", true);
        // Connect to MongoDB using the provided URI
        mongoose.connect(this.#DB_URI).then(()=>{
            console.log("Connect to DB is Successful");
        }).catch((e)=>{
            console.log("No connection " + e);
        });
        // Event listeners for Mongoose connection status
        mongoose.connection.on("connected" , () => {
            console.log("mongoose connected to db");
        });
        mongoose.connection.on("disconnected", () => {
            console.log("mongoose connection is disconnected");
        });
        // Gracefully handle SIGINT signal (Ctrl+C) to close MongoDB connection before exiting
        process.on("SIGINT", async() => {
            console.log("CLOSED");
            await mongoose.connection.close();
            process.exit(0);
        });
    }

    // Method to create routes for the application
    createRoutes(){
        // Mount all routes defined in the AllRoutes router
        this.#app.use(AllRoutes);
    }

    // Method to handle errors in the application
    errorHandling(){
        // Middleware to handle 404 errors (Page not found)
        this.#app.use((req,res,next) => {
            next(createError.NotFound("Page not found"));
        });
        // Middleware to handle other errors (Internal Server Error)
        this.#app.use((error, req,res,next)=> {
            // Set status code and error message based on the error or default to Internal Server Error
            const serverError = createError.InternalServerError();
            const statusCode = error.status || serverError.status;
            const message = error.message || serverError.message;
            // Send JSON response with error details
            return res.status(statusCode).json({
                errors: {
                    statusCode,
                    message
                }
            });
        });
    }
}
