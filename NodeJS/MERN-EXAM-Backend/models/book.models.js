const mongoose = require("mongoose");


const BookList = new mongoose.Schema({
    title : {type:String},
    author : {type:String},
    description : {type:String},
},{
    timestamps: true
});
const BookModel = mongoose.model("book", BookList)
module.exports = {
    BookModel
}