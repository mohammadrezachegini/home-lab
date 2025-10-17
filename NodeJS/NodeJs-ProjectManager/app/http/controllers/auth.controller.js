const { UserModel } = require("../../models/user");
const { HashString, tokenGenerator } = require("../../modules/function");
const bcrypt = require("bcrypt");
const user = require("../../routers/user");

class AuthControllers{

    async register(req,res,next){

        try {
            const {username,password,email,mobile} = req.body;
            const hash_password = HashString(password);
            const user = await UserModel.create({
                username,email, password: hash_password, mobile
            })
            return res.json(user)
        } catch (error) {
            next(error)
        }
        
    }

    async login(req,res,next){
        try {
            const {username, password} = req.body
            const usr = await UserModel.findOne({username})
            if(!usr) throw {status: 401, message: "Username or password is wrong"}
            const compatreResult = bcrypt.compareSync(password, usr.password)
            if(!compatreResult) throw {status: 401, message: "Username or password is wrong"}
            const token = tokenGenerator({username: username})
            usr.token = token;
            await usr.save();
            return res.status(200).json({
                status:200,
                success: true,
                message: "successfull logged in",
                token
            })
        } catch (error) {
            next(error)
        }
    }

    resetPassword(){}
}

module.exports = {
    authController: new AuthControllers()
}