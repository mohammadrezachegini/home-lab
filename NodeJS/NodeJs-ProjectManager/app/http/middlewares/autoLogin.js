const { verify } = require("jsonwebtoken");
const { UserModel } = require("../../models/user");
const { verifyJwtToken } = require("../../modules/function");

const checkLogin = async (req,res,next) => {
    try {
        let authError = {status: 401, message:"Please Login in to your account"};
        const authorization = req?.headers?.authorization;
        console.log(authorization);
        if(!authorization) throw authError
        let token = authorization.split(" ")?.[1];
        if(!token) throw authError
        const result = verifyJwtToken(token)
        const {username} = result
        console.log(result);
        const user = await UserModel.findOne({username},{password: 0})
        if(!user) throw authError
        req.user = user
        return next()
    } catch (error) {
        next(error)
    }
}

module.exports = {
    checkLogin
}