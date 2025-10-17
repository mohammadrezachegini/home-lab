const {query} = require("express-validator")
const {idValidator} = require("./blog.validator");


const searchValidator = () => [
    query('title').isEmpty().isString().matches(/[a-z0-9]*/gim),
    query('sort').matches(/ASC|DESC/).withMessage(idValidator)
]