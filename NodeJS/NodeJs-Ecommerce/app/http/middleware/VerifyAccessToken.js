const createError = require("http-errors")
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET_KEY } = require("../../../utils/constans");
const { UserModel } = require("../../models/users");

function getToken(headers){
    const [bearer, token] =  headers?.authorization?.split(" ") || []
    if(token && ["Bearer","bearer"].includes(bearer)) return token;
    throw createError.Unauthorized("Login failed - Please Login into your account");
}


function VerifyAccessToken(req,res,next){
    try {
        const token = getToken(req.headers);
            jwt.verify(token, ACCESS_TOKEN_SECRET_KEY, async  (err, payload) => {
                if(err) throw createError.InternalServerError("Please Log in into your account")
                const {mobile} = payload || {};
                const user = await UserModel.findOne({mobile}, {otp:0 , password:0 })
                if(!user) throw createError.InternalServerError("Username not found")
                req.user = user;
                console.log(req.user);
                return next()
            })
                
    } catch (error) {
        next(error)
        
    }
}



module.exports = {
    VerifyAccessToken,
}