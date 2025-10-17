const Joi = require("@hapi/joi")
const { MongoIDPattern } = require("../../../../utils/constans")

const addRoleSchema = Joi.object({
    title: Joi.string().min(3).max(30).error(new Error("Your role is invalid")),
    description: Joi.string().min(3).max(100).error(new Error("Your description is invalid")),
    permissions: Joi.array().items(Joi.string()).error(new Error("Your permission is invalid")),
    // permissions: Joi.array().items(Joi.string().pattern(MongoIDPattern)).error(new Error("Your permission is invalid")),
});


const addPermissionSchema = Joi.object({
    title: Joi.string().min(3).max(30).error(new Error("Your role is invalid")),
    description: Joi.string().min(3).max(100).error(new Error("Your description is invalid")),
});


module.exports = {
    addRoleSchema,
    addPermissionSchema,
}