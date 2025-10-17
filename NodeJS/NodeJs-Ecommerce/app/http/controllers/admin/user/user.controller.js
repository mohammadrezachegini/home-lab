const Controller = require('../../controllers')
const {UserModel} = require("../../../../models/users")
const {StatusCodes: HttpStatus} = require('http-status-codes')
const { deleteInvalidPropertyInObject } = require('../../../../../utils/function')
class UserController extends Controller {


    async getAllUsers(req,res,next){
        try {
            const {search} = req.query
            const databaseQuery = {}
            if(search){
                databaseQuery["$text"] = { $search: search }
            }
            const users = await UserModel.find({databaseQuery})
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data:{
                    message: 'Users found',
                    users
                }
            })
        } catch (error) {
            next(error)
        }
    }

    async updateUserProfileById(req,res,next){
        try {
            const userID = req.user._id
            const data = req.body
            const BlackListFields = ["mobile", "otp", "bills", "discount", "roles", "courses"]
            deleteInvalidPropertyInObject(data, BlackListFields)
            const profileUpdateResult = await UserModel.updateOne({_id: userID}, { $set: data })
            if(!profileUpdateResult.modifiedCount) throw new createHttpError.InternalServerError("update failed")
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data:{
                    message: 'Profile updated',
                    profileUpdateResult
                }
            })
        } catch (error) {
            next(error)
        }
    }


    async userProfile(req, res, next){
        try {
            const user = req.user;
            //bill, courses, discount, 
            console.log(await getBasketOfUser(user._id));
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    user
                }
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = {
    UserController : new UserController()
}