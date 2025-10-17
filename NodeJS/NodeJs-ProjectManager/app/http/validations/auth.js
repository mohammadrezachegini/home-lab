const {body} = require("express-validator")
const { UserModel } = require("../../models/user")

function registerValidator() {

    return [
        body("username").custom( async (value,ctx) => {

            if(value){
                const usernameRegex = /^[a-z]+[a-z0-9\_\.]{2,}/gi;
                if(usernameRegex.test(value)){
                    const user = await UserModel.findOne({username: value})
                    if(user) throw "Username is already existed"
                    return true
                }
                throw "Your username is invalid"
            }
            throw "You username could not be empty"
        }),
        body("email").isEmail().withMessage("your email is invalid").custom( async email => {
            const user = await UserModel.findOne({email})
            if(user) throw " Email is already existed"
            return true
        }),
        body("mobile").isMobilePhone("en-CA").withMessage("Your mobile Number is incorrect")
        .custom( async mobile => {
            const user = await UserModel.findOne({mobile})
            if(user) throw " Mobile is already existed"
            return true
        }),
        body("password").isLength({min: 6, max: 16}).withMessage("Your password should be between 6 and 16 characters").custom((value, ctx )=> {
                if(!value){ 
                    throw "Your Password could not be empty";
                }
                if(value !== ctx?.req?.body?.confirm_password) {
                    throw "Your password does not match"
                }
                return true
            })
        
    ]

}




function loginValidator() {

    return [
        body("username").custom( username => {
            
            const usernameRegex = /^[a-z]+[a-z0-9\_\.]{2,}/gi;
                if(usernameRegex.test(username)){
                    return true
                }
                throw "Your username is invalid"
            }
        ),
        
        body("password").isLength({min: 6, max: 16}).withMessage("Your password should be between 6 and 16 characters")
        
    ]
}
module.exports= {
    registerValidator,
    loginValidator
}