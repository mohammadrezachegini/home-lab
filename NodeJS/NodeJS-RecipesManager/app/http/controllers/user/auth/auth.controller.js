// Importing necessary utilities and models
const {HashString, SignAccessToken, SignRefreshToken} = require('../../../../../utils/function');
const {UserModel} = require('../../../../models/user');
const bcrypt = require("bcrypt");

class AuthControllers {



  async register(req, res, next){
      try {
          // Destructuring to extract user input from the request body
          const {first_name, last_name, email, password} = req.body;
          // Logging the request body for debugging
          console.log("req body is " + req.body);
          // Hashing the user's password for secure storage
          const hash_password = HashString(password);
          // Logging the hashed password for debugging
          console.log("Hashed password is " + hash_password);
          // Creating a new user document in the database
          const user = await UserModel.create({
              first_name, last_name, email, password: hash_password
          })
          // Logging the created user for debugging
          console.log("User is " + user);
          // Sending the created user object as the response
          return res.json(user);
      } catch (error) {
          // Passing any caught errors to the next middleware (error handler)
          next(error);
      }
  }

  async getUserById(req, res, next) {
    try {
        // Extracting the user ID from the request parameters
        const userID = req.params.id;
        // Finding the user by ID in the database and populating their recipes
        const user = await UserModel.findById(userID).populate('recipes');
        // If no user is found, throw a 404 error
        if (!user) throw { status: 404, message: "User not found" };
        // Sending the found user object as the response
        return res.status(200).json({
            status: 200,
            success: true,
            user
        });
    } catch (error) {
        // Passing any caught errors to the next middleware (error handler)
        next(error);
    }
}

  // Method for user login
  async login(req,res,next){
    try {
        // Extracting email and password from the request body
        const { email, password } = req.body;
        // Finding the user by email, excluding their accessToken in the result
        const user = await UserModel.findOne({ email }, { accessToken: 0})
        // Logging the user for debugging
        console.log("Login section " + user);
        // If no user is found or password does not match, throw an error
        if(!user) throw {status: 401, message: "Email or password is wrong"}
        const compareResult = bcrypt.compareSync(password, user.password)
        if(!compareResult) throw {status: 401, message: "Email or password is wrong"}
        // Generating a new refresh token for the user
        const refreshToken = await SignRefreshToken(user._id);
        // Checking if the user is already logged in by examining the refreshToken
        await UserModel.findOne({ _id: user._id  })
        .then(async (users) => {
            if(users.refreshToken === "0") {
                // If not logged in, save the new refreshToken and return success response
                users.refreshToken = refreshToken;
                users.save();
                return res.status(200).json({
                    statusCode : 200,
                    success: true,
                    message: "successful logged in",
                    data: {
                        refreshToken,
                        users
                    }
                });
            } else {
                // If already logged in, return an error response
                return res.status(401).json({
                    statusCode : 401,
                    success: false,
                    message: "You are already logged in",
                    user
                });
            }
        });
    } catch (error) {
        // Passing any caught errors to the next middleware (error handler)
        next(error);
    }
}

  async logout(req,res,next){
    try {
        // Extracting userId from the request body
        const { userId } = req.body;
        // Logging the request body for debugging
        console.log(req.body);
        // Finding the user by userId
        const user = await UserModel.findOne({ userId })
        // Logging the userId and user for debugging
        console.log("LOGOUT USER ID " + userId );
        console.log("LOGOUT USER " + user );
        // Resetting the user's refreshToken to "0" to indicate they are logged out
        await UserModel.findOneAndUpdate({ _id: userId }, { refreshToken: "0" }, { new: true })
        .then(async (users) => {
            // Returning a success response upon logout
            return res.status(200).json({
                statusCode : 200,
                success: true,
                message: "successful logged out",
                data: {
                    users
                }
            });
        });
    } catch (error) {
        // Passing any caught errors to the next middleware (error handler)
        next(error);
    }
}


  async refreshToken(req,res,next){
    try {
        // Extracting the refreshToken from the request body
        const {refreshToken} = req.body
        // Assuming VerifyRefreshToken is a function to verify the refreshToken and extract the email
        const email = VerifyRefreshToken(refreshToken)
        // Finding the user by email
        const user = await UserModel.findOne({email})
        // Generating a new access token and refresh token for the user
        const accessToken = await SignAccessToken(user._id)
        const newRefreshToken = await SignRefreshToken(user._id)
        // Returning the new tokens in the response
        return res.json({
            data : {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        // Error handling is not implemented here, but should be added
    }
}

  async checkExistUser(email) {
    // Finding the user by email
    const user = await UserModel.findOne({ email });
    return user;
}
}

module.exports = {
  authController: new AuthControllers()
}
