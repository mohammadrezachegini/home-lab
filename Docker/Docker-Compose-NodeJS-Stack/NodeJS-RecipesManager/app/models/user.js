const mongoose = require("mongoose");

// Defining the UserSchema
const UserSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    numberOfRecipes: { type: Number },
    password: { type: String, required: true },
    refreshToken: { type: String, default: "0" },
    // Field for references to associated recipes (array of ObjectIds referencing 'Recipe' model)
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }] 
}, {
    timestamps: true
});

const UserModel = mongoose.model("user", UserSchema);

module.exports = {
    UserModel
};
