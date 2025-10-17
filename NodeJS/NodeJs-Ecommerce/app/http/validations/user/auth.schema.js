const Joi = require("@hapi/joi")

const getOtpSchema = Joi.object({
    // email: Joi.string().lowercase().trim().email().required().error(new Error("Your email is invalid")),
    // password: Joi.string().min(6).max(16).trim().required().error(new Error("password length must be at least 6 characters long"))
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required().error(new Error("Your phone number is invalid"))
})

const checkOtpSchema = Joi.object({

    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required().error(new Error("Your phone number is invalid")),
    code: Joi.string().min(5).max(10).error(new Error("the code that you sent is incorrect"))

})

module.exports = {
    getOtpSchema,
    checkOtpSchema
}