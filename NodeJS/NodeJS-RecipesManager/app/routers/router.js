const router = require('express').Router();

// Importing user authentication routes
const { userAuthRoutes } = require("./users/auth");

// Importing recipe routes
const { recipeRoutes } = require("./recipe/recipe");

// Mounting user authentication routes under the "/user" endpoint
router.use("/user", userAuthRoutes);

// Mounting recipe routes under the "/recipe" endpoint
router.use("/recipe", recipeRoutes);

// Exporting all routes
module.exports = {
    AllRoutes: router
};
