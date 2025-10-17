const Schema = require("validate")


const registerSchema = new Schema({
    username: {
        type: String,
        required: true,
        length: {min: 4, max: 20},
        message: {
            length:"username is less than 4 characters"
           
        }
    },
    email: {
        type: String,
        required: true,
        match: /[a-z0-9]\_\.]{5,50}@[a-z]{2,10}.[a-z]{2,10}/gi,
        message: {
            type:"email must to be string",
            match: "email format is invalid",
            required:"email is required"
        }
    },
    role: {
        type: String,
        enum: ['user','admin','teacher']
    }
})

module.exports = {
    registerSchema
}