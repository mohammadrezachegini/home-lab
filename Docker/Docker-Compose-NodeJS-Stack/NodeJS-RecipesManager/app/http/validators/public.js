const {param} = require("express-validator");

function mongoIDValidator(){
    return [
        // Validates that the 'id' route parameter is a valid MongoDB Object ID
        // and provides a custom error message if the validation fails
        param("id").isMongoId().withMessage("The id is invalid")
    ];
}

module.exports = {
    mongoIDValidator
};
