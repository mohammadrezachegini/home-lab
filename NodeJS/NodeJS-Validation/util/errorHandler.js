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
    return res.json({
        statusCode:  err.status || 500,
        error: {
            message: err.message || "Internal Server Error",
            invalidParams: err.error
        }
    })
}

module.exports = {
    NotFoundError,
    ErrorHandler
}