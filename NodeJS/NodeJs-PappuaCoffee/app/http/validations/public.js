const {param} = require("express-validator")

function  mongoIDValidator(){
    return [
        param("id").isMongoId().withMessage("The id is invalid")
    ]
}

module.exports = {
    mongoIDValidator
}