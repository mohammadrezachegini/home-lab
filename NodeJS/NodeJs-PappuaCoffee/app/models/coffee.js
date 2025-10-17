const mongoose = require("mongoose");


const CoffeeSchema = new mongoose.Schema({
    product_name : {type:String, required:true},
    description : {type:String, required:true},
    price : {type:String, required:true},
    image : {type:String, required: true},
    qty:{type:Number, required:true, default:1},
    

},{
    timestamps: true
});
const CoffeeModel = mongoose.model("coffee", CoffeeSchema)
module.exports = {
    CoffeeModel
}