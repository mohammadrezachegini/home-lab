const {BookModel} = require("../models/book")
 
async function register(req,res,next){
    console.log(req)
    try {
        const {title,author,description} = req.body;
        console.log("BODY IS " + req.body)
        console.log(title);
        console.log(author);
        console.log(description);
        const book = await BookModel.create({
            title,
            author,
            description
        })
        return res.status(201).json(book)

        
    } catch (error) {
        console.log(error);
        next(error);
        
    }
}


async function getAllBook(req,res,next){
    try {
        // console.log(req);
        // const coffeeID = req.coffee._id
        const books = await BookModel.find({})
        return res.status(200).json(
            books
        )
    } catch (error) {
        next(error)
    }
}

async function DeleteBookById(req,res,next){
    try {
        // console.log(req);
        const book_id = req.params.id;
        const books = await BookModel.findByIdAndDelete({_id: book_id})
        return res.status(204).json(
            books
        )
    } catch (error) {
        next(error)
    }
}

async function DeleteAllBook(req,res,next){
    try {
        // console.log(req);
        const result = await BookModel.deleteMany({});
        return res.status(204).json(result);

    } 
    catch (error) {
        next(error)
    }
}



module.exports = {
    register,
    getAllBook,
    DeleteBookById,
    DeleteAllBook
}