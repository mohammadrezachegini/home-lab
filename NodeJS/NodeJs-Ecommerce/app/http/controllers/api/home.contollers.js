// const { authSchema } = require("../../validations/user/auth.schema");
const Controller = require("../controllers");
const createError = require("http-errors")
const {StatusCodes:HttpStatus} = require("http-status-codes")

module.exports = new class HomeController extends Controller {
    indexPage(req,res,next) {
        try {
            return res.status(HttpStatus.OK).send("Index Page")
        } catch (error) {
            next(error)
        }
        // 
    }
}