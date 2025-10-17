const createError = require("http-errors")
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET_KEY } = require("../../../utils/constants");
const { UserModel } = require("../../models/user");
function VerifyAccessToken(req,res,next){
    const headers = req.headers;
    const [bearer, token] =  headers?.["access-token"]?.split(" ") || []
    if(token && ["Bearer","bearer"].includes(bearer)){
        jwt.verify(token, ACCESS_TOKEN_SECRET_KEY, async  (err, payload) => {
            if(err) return next(createError.Unauthorized("Please Log in into your account"))
            const {email} = payload || {};
            const user = await UserModel.findOne({email}, {otp:0 , password:0 })
            if(!user) return next(createError.Unauthorized("Username not found"))
            req.user = user;
            console.log(req.user);
            return next()
        })
    }  
    else return next(createError.Unauthorized("please Login into your account"));
}

module.exports = {
    VerifyAccessToken
}