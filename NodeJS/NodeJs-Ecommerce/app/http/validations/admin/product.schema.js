const { allow } = require("@hapi/joi");
const Joi = require("@hapi/joi")
const createError = require("http-errors")
const {MongoIDPattern} = require("../../../../utils/constans")

const createProductSchema = Joi.object({
    title: Joi.string().min(3).max(255).error(createError.BadRequest("Your title is invalid")),
    text: Joi.string().error(createError.BadRequest("Your text is invalid")),
    short_text: Joi.string().min(3).max(255).error(createError.BadRequest("Your short text is invalid")),
    filename: Joi.string().pattern(/(\.png|\.jpg|\.webp|\.jpeg|\.gif)$/).error(createError.BadRequest("Your image is invalid")),
    // tags: Joi.array().items(Joi.string()).min(0).max(20).required().error(createError.BadRequest("The tags field must be an array of strings with 0 to 20 elements.")),
    tags: Joi.allow(),
    category: Joi.string().pattern(MongoIDPattern).error(createError.BadRequest("Your category is invalid")),
    price: Joi.number().error(createError.BadRequest("Your price is invalid")),
    discount: Joi.number().error(createError.BadRequest("Your discount is invalid")),
    count: Joi.number().error(createError.BadRequest("Your count is invalid")),
    weight: Joi.number().allow(null,0,"0").error(createError.BadRequest("Your wight is invalid")),
    height: Joi.number().allow(null,0,"0").error(createError.BadRequest("Your height is invalid")),
    length: Joi.number().allow(null,0,"0").error(createError.BadRequest("Your length is invalid")),
    width: Joi.number().allow(null,0,"0").error(createError.BadRequest("Your width is invalid")),
    fileUploadPath: Joi.allow(),
    colors: Joi.allow(),
    type: Joi.allow()

});


module.exports = {
    createProductSchema,
}