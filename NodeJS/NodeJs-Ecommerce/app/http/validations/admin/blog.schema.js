const Joi = require("@hapi/joi")
const createError = require("http-errors")
const {MongoIDPattern} = require("../../../../utils/constans")

const createBlogSchema = Joi.object({
    title: Joi.string().min(3).max(255).error(createError.BadRequest("Your title is invalid")),
    text: Joi.string().error(createError.BadRequest("Your text is invalid")),
    short_text: Joi.string().min(3).max(255).error(createError.BadRequest("Your short text is invalid")),
    filename: Joi.string().pattern(/(\.png|\.jpg|\.webp|\.jpeg|\.gif)$/).error(createError.BadRequest("Your image is invalid")),
    tags: Joi.array().min(0).max(20).error(createError.BadRequest("Your tags is invalid")),
    category: Joi.string().pattern(MongoIDPattern).error(createError.BadRequest("Your category is invalid")),
    fileUploadPath: Joi.allow()
});

const updateCategorySchema = Joi.object({
    title: Joi.string().min(3).max(30).error(createError.BadRequest("Your title is invalid")),

});

module.exports = {
    createBlogSchema,
    updateCategorySchema
}