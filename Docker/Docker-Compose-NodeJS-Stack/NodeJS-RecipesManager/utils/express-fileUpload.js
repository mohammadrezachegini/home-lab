// Importing required modules and functions
const fileupload = require("express-fileupload");
const path = require("path");
const { createUploadPath } = require("./function");

// Middleware function to handle file uploads
const uploadFile = async (req, res, next) => {
    try {
        // Checking if the request contains files and the 'image' file is present
        if (!req.files || Object.keys(req.files).length === 0 || !req.files.image) {
            throw { status: 400, message: "Please upload an image." };
        }

        // Extracting the 'image' file from the request
        let image = req.files.image;
        // Extracting the file extension and converting it to lowercase
        let type = path.extname(image.name).toLowerCase();

        // Checking if the file format is supported (only allowing certain formats)
        if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(type)) {
            throw { status: 400, message: "Unsupported file format. Allowed formats: .png, .jpg, .jpeg, .webp, .gif" };
        }

        // Generating a unique image name based on the current timestamp and file extension
        const imageName = `${Date.now()}${type}`;
        console.log("Uploading image ----> " + imageName);
        // Constructing the complete file path for saving the uploaded image
        const imagePath = path.join(createUploadPath(), imageName);
        const uploadPath = path.join(__dirname, "..", imagePath);

        // Moving the uploaded image to the specified upload path
        image.mv(uploadPath, (err) => {
            if (err) {
                // If there's an error while moving the file, throw an error
                throw { status: 500, message: "Failed to upload the image." };
            }
            // If file upload is successful, add the image path to the request body and proceed to the next middleware
            req.body.image = imagePath;
            next();
        });
    } catch (error) {
        // If any error occurs during file upload or validation, pass it to the error handling middleware
        next(error);
    }
};

module.exports = {
    uploadFile
};
