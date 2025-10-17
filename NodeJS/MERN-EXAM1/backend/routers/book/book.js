const  book= require('../../controllers/book.controllers');
const router = require("express").Router();

router.post("/create", book.register )
router.get("/", book.getAllBook )
router.delete("/delete/:id", book.DeleteBookById )
router.delete("/delete/", book.DeleteAllBook )


module.exports = {
    BookRoutes: router
}