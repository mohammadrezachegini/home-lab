const router = require('express').Router();
const {BookRoutes} = require('../routers/book/book.routers');

router.use("/", BookRoutes);


module.exports = {
    AllRoutes: router
}