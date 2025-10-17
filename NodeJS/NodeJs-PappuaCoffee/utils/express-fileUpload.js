const fileupload = require("express-fileupload");
const path = require("path")
const {createUploadPath} = require("./function")

const uploadFile = async (req,res,next) => {
    try {
        // fileupload();
        console.log("ReQ FILE IS " + req.files.image);
        if(req.file || Object.keys(req.files).length == 0) throw {status : 400, message: "please upload the profile picture for coffee"}
        let image = req.files.image
        console.log("image in upload file is   " + image);
        let type = path.extname(image.name);
        console.log("type in upload file is   " + type);
        
        if(![".png", ".jpg", ".jpeg", ".webp",".gif"].includes(type)) throw {
            status: 400,
            message: "Format is wrong"
        }
        const image_path = path.join(createUploadPath(), (Date.now() + type))
        console.log("IMAGEE PATH" + image_path);
        console.log("req body image " + req.files.image);
        req.files.image = image_path.substring(7)
        console.log("image_path" + image_path);
        let uploadPath = path.join(__dirname,".." , image_path)
        console.log(uploadPath);
        image.mv(uploadPath, (err) => {
            if(err) throw{status: 500, message: "Upload file is uncompleted"}
            next()
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    uploadFile
}