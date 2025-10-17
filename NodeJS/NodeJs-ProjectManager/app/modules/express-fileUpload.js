const fileUpload = require("express-fileupload")
const path = require("path")
const {createUploadPath} = require("./function")

const uploadFile = async (req,res,next) => {
    try {
        fileUpload();
        console.log(req.file);
        if( req.file || Object.keys(req.files).length == 0) throw {status : 400, message: "pleaswe send the profile picture for project"}
    
        let image = req.files.image
        console.log("IMAGEEEEE" + image);
        let type = path.extname(image.name)
        console.log("Typeeeee" + type);
        if(["png", "jpg", "jpeg", "webp","gif"].includes(type)) throw {
            status: 400,
            message: "Format is wrong"
        }
        const image_path = path.join(createUploadPath(), (Date.now() + type))
        console.log("IMAGEE PATH" + image_path);
        console.log("req body image " + req.files.image);
        req.files.image = image_path.substring(6)
        console.log(image_path);
        let uploadPath = path.join(__dirname, "..",".." , image_path)
        console.log(uploadPath);
        image.mv(uploadPath, (err) => {
            if(err) throw{status: 500, message: "Upload file is incompleted"}
            next()
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    uploadFile
}