const router = require('express').Router();
const {BookRoutes} = require('../routers/book/book');

// router.get("/", )
router.use("/book", BookRoutes);


module.exports = {
    AllRoutes: router
}