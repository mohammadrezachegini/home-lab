const { JoiValidationMapper } = require("./express-validation-mapper");

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
        statusCode:  err.status || 500,
        error: {
            message: err.message?.replace(/[\"\'\\]*/g, '') || "Internal Server Error",
            // invalidParams: JoiValidationMapper(err)
        }
    })
}

module.exports = {
    NotFoundError,
    ErrorHandler
}