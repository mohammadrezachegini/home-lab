const Joi = require("@hapi/joi")
const { MongoIDPattern } = require("../../../../utils/constans")

const addCategorySchema = Joi.object({
    title: Joi.string().min(3).max(30).error(new Error("Your category is invalid")),
    parent: Joi.string().allow('').pattern(MongoIDPattern).allow("").error(new Error("Your category id is invalid"))

});

const updateCategorySchema = Joi.object({
    title: Joi.string().min(3).max(30).error(new Error("Your category is invalid")),

});


module.exports = {
    addCategorySchema,
    updateCategorySchema
}