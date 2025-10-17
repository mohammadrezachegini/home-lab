const {param} = require("express-validator")

const idValidator = param("id").isMongoId().withMessage("Invalid object ID");


module.exports = {
    idValidator
}
