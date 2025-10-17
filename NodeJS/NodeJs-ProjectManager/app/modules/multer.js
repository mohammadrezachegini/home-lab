const path  = require("path")
const multer = require("multer")
const { createUploadPath } = require("./function")



const storage = multer.diskStorage({
    destination: (req,res,cb) => {
        cb(null,createUploadPath())
    },
    filename: (req,file,cb) => {
        const type = path.extname(file?.originalname || "")
        console.log(type);
        cb(null, Date.now() + type)
    }
})

const upload_multer = multer({storage: storage})

module.exports = {
    upload_multer
}