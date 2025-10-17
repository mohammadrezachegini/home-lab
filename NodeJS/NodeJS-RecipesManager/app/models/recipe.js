// Importing the mongoose library to interact with MongoDB
const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  // A reference to the chef (user) who created the recipe, using their ObjectId
  chef: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' },
  ingredients: [{ type: String, required: true }],
  instructions: [{ type: String, required: true }],
  time: { type: String, required: true },
  level: { type: String, required: true },
  image: { type: String, required: true }
});

const RecipeModel = mongoose.model('Recipe', RecipeSchema);

module.exports = RecipeModel;
