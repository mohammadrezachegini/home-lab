// Importing necessary modules and classes

// Recipe data model
const RecipeModel = require("../../../models/recipe");
 // Helper function to validate MongoDB Object IDs 
const { isValidObjectId } = require("mongoose");
const { createLink, createUploadPath } = require("../../../../utils/function");
 // Middleware for handling file uploads
const fileUpload = require("express-fileupload");
 // User data model
const { UserModel } = require('../../../models/user');
// Node.js module for handling file paths
const path = require("path"); 


const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: ""
});
class RecipeControllers {

  constructor() {

}


  async createRecipe(req, res, next) {
    try {
      // Destructuring request body to extract recipe details
      const { title, chef, ingredients, instructions, time, level } = req.body;
      // Accessing uploaded image from request files
      const image = req.files.image; 

      // Handling ingredients: converting string to array if necessary
      const ingredientsArray = Array.isArray(ingredients) ? ingredients : ingredients.split(',');
      const ingredientsWithHashtags = ingredientsArray.map(ingredient => `${ingredient.trim()}`);

      // Handling instructions: converting string to array if necessary
      const instructionsArray = Array.isArray(instructions) ? instructions : instructions.split(',');
      const instructionsWithHashtags = instructionsArray.map(instruction => `${instruction.trim()}`);

      // Validating image upload
      if (!image) {
        throw { status: 400, message: "Please upload an image." };
      }

      // Checking file type and rejecting unsupported formats
      let type = path.extname(image.name).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(type)) {
        throw { status: 400, message: "Unsupported file format. Allowed formats: .png, .jpg, .jpeg, .webp, .gif" };
      }

      // Setting up file storage path
      const imageName = `${Date.now()}${type}`;
      const uploadPath = createUploadPath();
      const imagePath = path.join(uploadPath, imageName);

      // Moving uploaded image to the designated path
      await image.mv(imagePath);

      // Creating a URL for the uploaded image
      const fullUrl = createLink(imagePath, req);

      // Creating new recipe document in the database
      const recipe = await RecipeModel.create({
        title,
        chef,
        ingredients: ingredientsWithHashtags,
        instructions: instructionsWithHashtags,
        time,
        level,
        image: fullUrl
      });

      // Handling error if recipe was not created successfully
      if (!recipe) {
        throw { status: 400, message: "There was a problem adding the recipe" };
      }

      // Updating user's recipe count and list
      await UserModel.findByIdAndUpdate(chef, { $inc: { numberOfRecipes: 1 }, $push: { recipes: recipe._id } });

      // Sending response with success message
      return res.status(201).json({
        status: 201,
        success: true,
        message: "Recipe added successfully"
      });
    } catch (error) {
      // Passing errors to the error-handling middleware
      next(error);
    }
  }

  async searchRecipes(req, res, next) {
    try {
      const { keyword } = req.query;

      const searchCriteria = {
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { ingredients: { $regex: keyword, $options: 'i' } },
          { instructions: { $regex: keyword, $options: 'i' } }
        ]
      };

      const recipes = await RecipeModel.find(searchCriteria);

      if (recipes.length === 0) {
        return res.status(200).json({
          status: 200,
          success: true,
          message: "No recipes found matching the search criteria",
          recipes: []
        });
      }

      // Sending response with found recipes
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Recipes found successfully",
        recipes
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllRecipes(req, res, next) {
    try {
      const recipes = await RecipeModel.find({});

      recipes.forEach(recipe => {
        recipe.image = createLink(recipe.image, req);
      });

      return res.status(200).json({
        status: 200,
        success: true,
        recipes
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeById(req, res, next) {
    try {
      const recipeID = req.params.id; 
      const recipe = await RecipeModel.findById(recipeID);

      if (!recipe) throw { status: 404, message: "Recipe not found" };

      recipe.image = createLink(recipe.image, req);

      return res.status(200).json({
        status: 200,
        success: true,
        recipe
      });
    } catch (error) {
      next(error);
    }
  }

  async removeRecipe(req, res, next) {
    try {
      const recipeID = req.params.id; 
      const recipe = await RecipeModel.findById(recipeID);

      if (!recipe) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Recipe not found"
        });
      }

      const deleteResult = await RecipeModel.deleteOne({ _id: recipeID });

      if (deleteResult.deletedCount === 0) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Recipe was not removed"
        });
      }

      const user = await UserModel.findById(recipe.chef);
      if (user) {
        user.numberOfRecipes -= 1;
        await user.save();
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Recipe deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }


  async getGptResponse(req, res, next) {
    try {
      const { prompt } = req.body;
      console.log(prompt);
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }


  
      // Adjusting API call according to the OpenAI SDK's expected usage

      const completionResponse = await openai.chat.completions.create ({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompt
        }],
        max_tokens: 150,
      });

      
      console.log(completionResponse.choices[0].message.content);

      res.status(200).json({ response: completionResponse.choices[0].message.content });
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      res.status(500).send("Internal Server Error");
    }
  }
}
  
 






module.exports = {
  RecipeController: new RecipeControllers()
};
