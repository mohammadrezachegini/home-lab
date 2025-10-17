const {body} = require("express-validator")
const loginValidator = () => [
    body("email").isEmail().withMessage("Invalid Email"),
    body("password").isLength({min: 6, max: 20}).withMessage("password must be at least 6 characters")
]

const registerValidator = () => [
    body("fullName").isLength({min: 5, max: 35}).withMessage("full name is require please enter your full name"),
    // body("age").isNumeric().withMessage("age must be a number"),
    body("age").custom( value => {
        if(isNaN(value)){
            throw new Error("age must be a number")
        } else if(+value > 90 || +value < 12) {
            throw new Error("you age is not in valid range")
        }
        return true
    }),
    body("mobile").isMobilePhone(['en-CA','en-US']).withMessage("The phone number is wrong"),
    body("email").isEmail().withMessage("Invalid Email"),
    body("password").isLength({min: 6, max: 20}).withMessage("password must be at least 6 characters"),
    body("confirmPassword").custom((value, {req}) => {
        if(value !== req.body.password){
            throw  new Error("Password does not match")
        }
        return true
    })
]


module.exports = {
    loginValidator,
    registerValidator
}