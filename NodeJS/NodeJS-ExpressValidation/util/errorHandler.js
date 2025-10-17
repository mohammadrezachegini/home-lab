const { validationMapper } = require("../validators/express-validation-mapper");

const NotFoundError = (req,res,next) => {
    return res.status(404).json({
        statusCode: res.statusCode,
        error: {
            type: "NotFound",
            message: "Not found " + req.url + " routes"
        },
    })
}

const ErrorHandler = (err,req,res,next) => {
    console.log(JSON.stringify(err,null,4));
    return res.json({
        statusCode:  err.status || err.statusCode || 500,
        error: {
            message: err.message || "Internal Server Error",
            invalidParams: validationMapper(err)
        }
    })
}

module.exports = {
    NotFoundError,
    ErrorHandler
}