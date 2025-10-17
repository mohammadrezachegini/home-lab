const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
    first_name : {type:String},
    last_name : {type:String},
    email : {type:String, required: true, unique: true,lowercase: true},
    password : {type:String, required: true},
    refreshToken:{type:String, default:"0"},

    

},{
    timestamps: true
});
const UserModel = mongoose.model("user", UserSchema)
module.exports = {
    UserModel
}