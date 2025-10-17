// Importing validationResult from express-validator to extract validation results from a request
const {validationResult} = require("express-validator");

function expressValidatorMapper(req, res, next) {
    // Initialize an empty object to store validation error messages
    let messages = {};
    // Extracting the validation result from the request
    const result = validationResult(req);
    // Resetting messages to an empty object, redundant after its initial declaration
    messages = {}
    // Checking if there are any validation errors
    if (result?.errors?.length > 0) {
        // Loop through each error in the errors array
        result?.errors.forEach((err) => {
            // Map each error message to the corresponding request parameter (field) causing the validation error
            messages[err.param] = err.msg;
        });
        // If there are validation errors, return a response with status 400 and the error messages
        return res.status(400).json({
            status : 400,
            success : false,
            messages
        });
    }
    // If there are no validation errors, proceed to the next middleware in the stack
    next();
}

module.exports = {
    expressValidatorMapper
};
