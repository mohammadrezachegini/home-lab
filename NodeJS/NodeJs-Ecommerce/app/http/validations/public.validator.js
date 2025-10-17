const Joi = require('@hapi/joi');
const createHttpError = require('http-errors');
const {MongoIDPattern} = require('../../../utils/constans')

const ObjectIdValidator = Joi.object({
    id : Joi.string().pattern(MongoIDPattern).error(new createHttpError.BadRequest("Your id is not a valid Mongo"))
})

module.exports = {
    ObjectIdValidator
}