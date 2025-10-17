const  book= require('../../controllers/book.controllers');
const router = require("express").Router();

router.get("/", book.getAllBook )
router.get("/:id",book.getBookById)
router.post("/", book.addBook )
router.put("/:id", book.updateBookById )
router.delete("/:id", book.DeleteBookById )


module.exports = {
    BookRoutes: router
}