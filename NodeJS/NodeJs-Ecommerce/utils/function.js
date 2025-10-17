const jwt = require("jsonwebtoken")
const createError = require("http-errors")
const { reject } = require("bcrypt/promises")
const { UserModel } = require("../app/models/users")
const { SECRET_KEY, ACCESS_TOKEN_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY } = require("./constans")
const redisClient = require("./init_redis")
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');


function randomNumberGenerator() {
    return Math.floor((Math.random() * 90000) + 10000 )
}


function SignAccessToken(userId){
    return new Promise(async (resolve, reject)=> {
        const user = await  UserModel.findById(userId)
        const payload = {
            mobile: user.mobile,
            // userID: user._id
        };
        const secret = ACCESS_TOKEN_SECRET_KEY;
        const options = {
            expiresIn: "1h"
        };

        jwt.sign(payload,ACCESS_TOKEN_SECRET_KEY,options, (err, token) => {
            if (err) reject(createError.InternalServerError("Internal server error"))
            resolve(token)
        })
    })

}

function deleteInvalidPropertyInObject(data = {}, blackListFields = []){
    
    let nullishData = ["", " ", "0", 0, null, undefined]

    Object.keys(data).forEach(key => {
        if(blackListFields.includes(key)) delete data[key]
        if(typeof data[key] == "string") data[key] = data[key].trim()
        if(Array.isArray(data[key]) && data[key].length > 0) data[key] = data[key].map(item => item.trim())
        if(Array.isArray(data[key]) && data[key].length == 0) delete data[key]
        if(nullishData.includes(data[key])) delete data[key]
        
    })
}

function SignRefreshToken(userId){
    return new Promise(async (resolve, reject)=> {
        const user = await  UserModel.findById(userId)
        const payload = {
            mobile: user.mobile
            // userID: user._id
        };
        // const secret = REFRESH_TOKEN_SECRET_KEY;
        const options = {
            expiresIn: "1y"
        };

        jwt.sign(payload,REFRESH_TOKEN_SECRET_KEY,options, async (err, token) => {
            if (err) {
                reject(createError.InternalServerError("Internal server error"))
            }
            await redisClient.setEx(String(userId), 31536000, token)

            resolve(token)
        })
    })

}

function VerifyRefreshToken(token){

        return new Promise((resolve,reject)=> {
            jwt.verify(token, REFRESH_TOKEN_SECRET_KEY, async  (err, payload) => {
                if(err) reject(createError.Unauthorized("Please Log in into your account"))
                const {mobile} = payload || {};
                const user = await UserModel.findOne({mobile}, {otp:0 , password:0 })
                if(!user) reject(createError.Unauthorized("Username not found"))
                
                const refreshToken = await redisClient.get(user._id)

                if(token === refreshToken){
                    
                    return resolve(mobile)
                }

                reject(createError.Unauthorized("Your tried to Login fir second time is  failed"))

                
                // req.user = user;
                // console.log(req.user);
                // return next()
            }) 
        })
}

function deleteFileInPublic(fileAddress){
    if(fileAddress){
        
        const pathFile = path.join(__dirname,"..","public", fileAddress)
        if(fs.existsSync(pathFile)) fs.unlinkSync(pathFile)
    }
}

function ListOfImagesFromRequest(files, fileUploadPath){
    if(files?.length > 0){
        return ((files.map(file => path.join(fileUploadPath, file.filename))).map(item => item.replace(/\\/g, "/")));
    }else{

        return []
    }
}

function setFeatures(body){
    const {colors,width, height, weight, length} = body
    let features = {}
    features.colors = colors
    if(!isNaN(+width) || !isNaN(+height) || !isNaN(+weight) || !isNaN(+length)){
        if(!width) features.width = 0
        else features.width = +width
        if(!height) features.height = 0
        else features.height = +height
        if(!length) features.length = 0
        else features.length = +length
        if(!weight) features.weight = 0
        else features.weight = +weight
    }
    return features
}

function copyObject(obj){
    return JSON.parse(JSON.stringify(obj))
}
function getTime(seconds) {
    let total = Math.round(seconds) / 60;
    let [minutes, percent] = String(total).split(".");
    let second = Math.round((percent * 60) / 100).toString().substring(0, 2);
    let houre = 0;
    if (minutes > 60) {
        total = minutes / 60
         let [h1, percent] = String(total).split(".");
         houre = h1,
         minutes = Math.round((percent * 60) / 100).toString().substring(0, 2);
    }
    if(String(houre).length ==1) houre = `0${houre}`
    if(String(minutes).length ==1) minutes = `0${minutes}`
    if(String(second).length ==1) second = `0${second}`
    
    return (houre + ":" + minutes + ":" +second)
}


function getVideoDuration(videoUrl) {
    return new Promise((resolve, reject) => {
      exec(`ffprobe -i ${videoUrl} -show_entries format=duration -v quiet -of csv="p=0"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          const duration = parseFloat(stdout);
          resolve(duration);
        }
      });
    });
  }

  function getTimeOfCourse(chapters = []){
    let time, hour, minute, second = 0;
    for (const chapter of chapters) {
        if(Array.isArray(chapter?.episodes)){
            for (const episode of chapter.episodes) {
                if(episode?.time) time = episode.time.split(":") // [hour, min, second]
                else time = "00:00:00".split(":")
                if(time.length == 3){
                    second += Number(time[0]) * 3600 // convert hour to second
                    second += Number(time[1]) * 60 // convert minute to second
                    second += Number(time[2]) //sum second with seond
                }else if(time.length == 2){ //05:23
                    second += Number(time[0]) * 60 // convert minute to second
                    second += Number(time[1]) //sum second with seond
                }
            }
        }
    }
    hour = Math.floor(second / 3600); //convert second to hour
    minute = Math.floor(second / 60) % 60; //convert second to mintutes
    second = Math.floor(second % 60); //convert seconds to second
    if(String(hour).length ==1) hour = `0${hour}`
    if(String(minute).length ==1) minute = `0${minute}`
    if(String(second).length ==1) second = `0${second}`
    return (hour + ":" + minute + ":" +second) 
} 

module.exports = {
    randomNumberGenerator,
    SignAccessToken,
    SignRefreshToken,
    VerifyRefreshToken,
    deleteFileInPublic,
    ListOfImagesFromRequest,
    copyObject,
    setFeatures,
    deleteInvalidPropertyInObject,
    getTime,
    getVideoDuration,
    getTimeOfCourse,
}