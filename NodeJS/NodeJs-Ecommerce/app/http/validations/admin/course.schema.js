const { allow } = require("@hapi/joi");
const Joi = require("@hapi/joi")
const createError = require("http-errors")
const {MongoIDPattern} = require("../../../../utils/constans")

const createCourseSchema = Joi.object({
    title: Joi.string().min(3).max(255).error(createError.BadRequest("Your course title is invalid")),
    full_desc: Joi.string().error(createError.BadRequest("Your text is invalid")),
    short_desc: Joi.string().min(3).max(255).error(createError.BadRequest("Your short text is invalid")),
    filename: Joi.string().pattern(/(\.png|\.jpg|\.webp|\.jpeg|\.gif)$/).error(createError.BadRequest("Your image is invalid")),
    // tags: Joi.array().items(Joi.string()).min(0).max(20).required().error(createError.BadRequest("The tags field must be an array of strings with 0 to 20 elements.")),
    tags: Joi.allow(),
    category: Joi.string().pattern(MongoIDPattern).error(createError.BadRequest("Your category is invalid")),
    price: Joi.number().error(createError.BadRequest("Your price is invalid")),
    discount: Joi.number().error(createError.BadRequest("Your discount is invalid")),
    fileUploadPath: Joi.allow(),
    type: Joi.string().regex(/(free|cash|special)/i).error(createError.BadRequest("Your type is invalid")),

});


const createEpisodeSchema = Joi.object({
    title: Joi.string().min(3).max(255).error(createError.BadRequest("Your course title is invalid")),
    text: Joi.string().error(createError.BadRequest("Your text is invalid")),
    type: Joi.string().regex(/(lock|unlock)/i).error(createError.BadRequest("Your type is invalid")),
    time: Joi.string().regex(/[0-9]{2}\:[0-9]{2}:[0-9]{2}/i).error(createError.BadRequest("Your time is invalid")),
    chapterID: Joi.string().pattern(MongoIDPattern).error(createError.BadRequest("Your chapter id is invalid")),
    courseID: Joi.string().pattern(MongoIDPattern).error(createError.BadRequest("Your course id is invalid")),
    fileUploadPath: Joi.allow(),
    filename: Joi.string().pattern(/(\.mp4|\.mkv|\.mov|\.mpg|\.avi)$/).error(createError.BadRequest("Your image is invalid")),


});


module.exports = {
    createCourseSchema,
    createEpisodeSchema,
}