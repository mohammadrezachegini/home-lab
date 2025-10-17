const mongoose = require("mongoose");


const BookSchema = new mongoose.Schema({
    title : {type:String},
    author : {type:String},
    description : {type:String},
},{
    timestamps: true
});
const BookModel = mongoose.model("book", BookSchema)
module.exports = {
    BookModel
}