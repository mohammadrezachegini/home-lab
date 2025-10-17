// Module to create HTTP errors for Express
const createError = require("http-errors") 
// Module to handle JWT operations
const jwt = require("jsonwebtoken"); 
// Importing the secret key used to sign JWTs
const { ACCESS_TOKEN_SECRET_KEY } = require("../../../utils/constants"); 
// User model for database operations
const { UserModel } = require("../../models/user"); 

// Defining the VerifyAccessToken middleware function
function VerifyAccessToken(req, res, next){
    // Extracting headers from the request
    const headers = req.headers;
    // Destructuring to extract the 'Bearer' keyword and the token from the 'access-token' header
    const [bearer, token] =  headers?.["access-token"]?.split(" ") || [];
    // Checking if the token exists and has the correct 'Bearer' format
    if(token && ["Bearer", "bearer"].includes(bearer)){
        // Verifying the token using the secret key
        jwt.verify(token, ACCESS_TOKEN_SECRET_KEY, async  (err, payload) => {
            // If token verification fails, respond with an Unauthorized error
            if(err) return next(createError.Unauthorized("Please Log in into your account"));
            // Extracting the email from the token's payload
            const {email} = payload || {};
            // Finding the user in the database, excluding sensitive information like otp and password
            const user = await UserModel.findOne({email}, {otp:0, password:0 });
            // If no user is found, respond with an Unauthorized error
            if(!user) return next(createError.Unauthorized("Username not found"));
            // Attaching the user object to the request for use in subsequent middleware/functions
            req.user = user;
            // Logging the user object for debugging purposes
            console.log(req.user);
            // Proceeding to the next middleware/function in the stack
            return next();
        });
    }  
    else {
        // If the token or 'Bearer' format is missing, respond with an Unauthorized error
        return next(createError.Unauthorized("Please log in to your account"));
    }
}

module.exports = {
    VerifyAccessToken
};
