const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")


function HashString(str){

    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(str,salt)

}

function tokenGenerator(payload){
    const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: "365 days"});
    return token
}

function verifyJwtToken(token){
    const result = jwt.verify(token, process.env.SECRET_KEY);
    if(!result?.username) throw {status: 401, message:"Please Login in to your account"}
    return result
}


function createUploadPath(){
    let d = new Date();
    const year = "" + d.getFullYear();
    const month = d.getMonth() + "";
    const day = "" + d.getDay();
    const uploadPath = path.join(__dirname, "..", "..", "public", "upload", year, month, day)
    fs.mkdirSync(uploadPath, {recursive: true})
    return path.join("public", "upload", year, month, day)
}


function createLink(fileAddress,req){
    return  fileAddress? (req.protocol + "://" + req.get("host")  + (fileAddress.replace(/[\\\\]/gm, "/"))) : undefined
}

module.exports = {
    HashString,
    tokenGenerator,
    verifyJwtToken,
    createUploadPath,
    createLink
}