const {body} = require("express-validator")
const path = require("path")
function ImageValidator() {
    return[
        body("image").custom((image, {req}) => {
            if(Object.keys(req.file).length == 0) throw "Please upload a picture"
            const ext = path.extname(req.file.originalname)
            const exts = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
            if(!exts.includes(ext)) throw "The format is wrong"
            const maxSize = 2 * 1024 * 1024;
            if(req.file.maxSize > maxSize) throw "Maximum size is 2MB"
            return true
        })
    ]
}


module.exports = {
    ImageValidator
}