const router = require("express").Router();
const { RecipeController } = require("../../http/controllers/recipe/recipe.controller"); 
const { uploadFile } = require("../../../utils/express-fileUpload");
const fileupload = require("express-fileupload");
const { mongoIDValidator } = require("../../http/validators/public");

/**  
 * @swagger
 * tags: 
 *  name: Recipes
 *  description: Recipes management section      
*/


/**
 * @swagger
 * /recipe/search:
 *   get:
 *     summary: Search recipes by keyword
 *     tags: [Recipes]
 *     description: Search for recipes containing a specific keyword in the title, ingredients, or instructions
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword to search for
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.get("/search", RecipeController.searchRecipes);

/**
 * @swagger
 *  /recipe/create:
 *      post:
 *          summary: Add a new recipe
 *          tags: [Recipes] 
 *          description: Add a new recipe to the database
 *          consumes:
 *              - multipart/form-data
 *          parameters:
 *              - in: formData
 *                name: title
 *                type: string
 *                required: true
 *                description: The title of the recipe
 *              - in: formData
 *                name: chef
 *                type: string
 *                required: true
 *                description: JSON string of chef details (firstName, lastName, numberOfRecipes)
 *              - in: formData
 *                name: ingredients
 *                type: array
 *                items:
 *                  type: string
 *                required: true
 *                description: List of ingredients
 *              - in: formData
 *                name: instructions
 *                type: array
 *                items:
 *                  type: string
 *                required: true
 *                description: Cooking instructions
 *              - in: formData
 *                name: time
 *                type: string
 *                required: true
 *                description: Cooking time
 *              - in: formData
 *                name: level
 *                type: string
 *                required: true
 *                description: Difficulty level
 *              - in: formData
 *                name: image
 *                type: file
 *                required: true
 *                description: Recipe image
 *          responses:
 *              201:
 *                  description: Recipe added successfully
 *              400:
 *                  description: Bad Request
 *              500:
 *                  description: Internal Server Error
*/
router.post("/create", fileupload(), uploadFile, RecipeController.createRecipe);

/**
 * @swagger
 *  /recipe/list:
 *      get:
 *          summary: Get all recipes
 *          tags: [Recipes] 
 *          description: Fetch all recipes from the database
 *          responses:
 *              200:
 *                  description: Success
 *              500:
 *                  description: Internal Server Error
*/
router.get("/list", RecipeController.getAllRecipes);

/**
 * @swagger
 *  /recipe/{id}:
 *      get:
 *          summary: Get a recipe by ID
 *          tags: [Recipes] 
 *          description: Fetch a single recipe by its ID
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *          responses:
 *              200:
 *                  description: Success
 *              404:
 *                  description: Recipe not found
 *              500:
 *                  description: Internal Server Error
*/
router.get("/:id", mongoIDValidator(), RecipeController.getRecipeById);

/**
 * @swagger
 * /recipe/remove/{id}:
 *  delete:
 *      summary: Delete a recipe by ID
 *      tags: [Recipes] 
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            type: string
 *            description: The ID of the recipe to delete
 *      responses:
 *          200:
 *              description: Recipe deleted successfully
 *          404:
 *              description: Recipe not found
 *          500:
 *              description: Internal Server Error
*/
router.delete("/remove/:id", mongoIDValidator(), RecipeController.removeRecipe);




/**
 * @swagger
 * /recipe/chatgpt:
 *   post:
 *     summary: Get response from ChatGPT
 *     tags:
 *       - Recipes
 *     description: Get response from ChatGPT based on the provided prompt
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Prompt for ChatGPT
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             prompt:
 *               type: string
 *               example: "Tell me a joke."
 *     responses:
 *       '200':
 *         description: Successful operation
 *         schema:
 *           type: object
 *           properties:
 *             response:
 *               type: string
 *               example: "Sure, here's a joke: Why don't scientists trust atoms? Because they make up everything!"
 *       '400':
 *         description: Invalid input
 *       '500':
 *         description: Internal server error
 */
router.post("/chatgpt", RecipeController.getGptResponse);

module.exports = {
    recipeRoutes: router
};
