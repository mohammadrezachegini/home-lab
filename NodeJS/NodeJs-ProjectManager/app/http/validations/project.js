const { body } = require("express-validator");

function createProjectValidator(){
    return [
        body("title").notEmpty().withMessage("Project title should't be empty"),
        // body("tags").isArray({min:0 , max:10}).withMessage("Maximum hashtags are 10"),
        body("text").notEmpty().isLength({min: 20}).withMessage("Project description should't be empty and it has to be at least 20 characters")
    ]
}

module.exports = {
    createProjectValidator 
}