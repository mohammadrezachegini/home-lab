const createError = require("http-errors")
const { ROLES } = require("../../../../../utils/constans")
const { randomNumberGenerator, SignAccessToken, VerifyRefreshToken, SignRefreshToken } = require("../../../../../utils/function")
const { UserModel } = require("../../../../models/users")
const { getOtpSchema,checkOtpSchema } = require("../../../validations/user/auth.schema")
const Controller = require('../../controllers');
const {StatusCodes:HttpStatus} = require("http-status-codes")

class UserAuthController extends Controller {

    async getOtp(req,res,next){
        try {
            await getOtpSchema.validateAsync(req.body);
            const { mobile } = req.body;
            const code = randomNumberGenerator()
            console.log(`The code is ${code}`);
            const result = await this.saveUser(mobile, code)
            if (!result) throw createError.Unauthorized("Login Failed")
            return res.status(HttpStatus.OK).send({
              data: {
               
                  message: "The code sent successfully",
                  code,
                  mobile
                }
            });
          } catch (error) {
            next(error);
          }
    }

    async checkOtp(req,res,next){
        try {
            await checkOtpSchema.validateAsync(req.body)
            const { mobile, code } = req.body;
            const user = await UserModel.findOne({ mobile }, { password: 0, accessToken: 0})
            if (!user) throw createError.NotFound("Username not found")
            if (user.otp.code != code) throw createError.Unauthorized("The code that you sent is incorrect");
            const now = (new Date()).getTime();
            if (+user.otp.expiresIn <  now) throw createError.Unauthorized("Your code is expired");
            const accessToken = await SignAccessToken(user._id)
            const refreshToken = await SignRefreshToken(user._id);
            console.log(accessToken);
            console.log(refreshToken);
            return res.status(HttpStatus.OK).json({
              statusCode : HttpStatus.OK,
              data: {
                accessToken,
                refreshToken,
                user
              }
            })
          } catch (error) {
            next(error)
          }
    }

    async saveUser(mobile,code){
        const now = (new Date().getTime())
        let otp = {
        code,
        expiresIn: (new Date().getTime() + 120000)
        }
        const user = await this.checkExistUser(mobile);

        if (user){
            console.log(otp.code, now);
            if (+user.otp.expiresIn > now) throw createError.Forbidden("Your code is not expired")
            return (await this.updateUser(mobile, { otp }))
        }
        return (await UserModel.create({
        mobile,
        otp,
        role: ROLES.USER
        }))
    }


    async refreshToken (req,res,next){
        try {
            const {refreshToken} = req.body
            const mobile = VerifyRefreshToken(refreshToken)
            const user = await UserModel.findOne({mobile})
            const accessToken = await SignAccessToken(user._id)
            const newRefreshToken = await SignRefreshToken(user._id)
            return res.json({
                data : {
                    accessToken,
                    refreshToken: newRefreshToken
                }
            })

        } catch (error) {
            
        }
    }

    async checkExistUser(mobile) {
        const user = await UserModel.findOne({ mobile });
        return user
      }

    async updateUser(mobile, objectData = {}) {
        Object.keys(objectData).forEach(key => {
          if (["", " ", 0, null, undefined, "0", NaN].includes(objectData[key])) delete objectData[key]
        })
        const updateResult = await UserModel.updateOne({ mobile }, { $set: objectData })
        return !!updateResult.modifiedCount
      }
    }

module.exports = {
    UserAuthController: new UserAuthController()
}