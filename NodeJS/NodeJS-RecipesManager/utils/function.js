// Importing required modules and libraries
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { UserModel } = require("../app/models/user");
const { SECRET_KEY, ACCESS_TOKEN_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY } = require("./constants");
const path = require("path");
const fs = require("fs");

// Function to hash a string using bcrypt
function HashString(str){
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(str, salt);
}

// Function to sign an access token using JWT
function SignAccessToken(userId){
    return new Promise(async (resolve, reject)=> {
        const user = await UserModel.findById(userId);
        const payload = {
            email: user.email,
        };
        const secret = ACCESS_TOKEN_SECRET_KEY;
        const options = {
            expiresIn: "1h"
        };

        jwt.sign(payload, ACCESS_TOKEN_SECRET_KEY, options, (err, token) => {
            if (err) reject(createError.InternalServerError("Internal server error"));
            resolve(token);
        });
    });
}

// Function to sign a refresh token using JWT
function SignRefreshToken(userId){
    return new Promise(async (resolve, reject)=> {
        const user = await UserModel.findById(userId);
        const payload = {
            email: user.email
        };
        const options = {
            expiresIn: "1y"
        };

        jwt.sign(payload, REFRESH_TOKEN_SECRET_KEY, options, async (err, token) => {
            if (err) {
                reject(createError.InternalServerError("Internal server error"));
            }
            resolve(token);
        });
    });
}

// Function to create upload path for files based on current date
function createUploadPath(){
    let d = new Date();
    const year = "" + d.getFullYear();
    const month = d.getMonth() + "";
    const day = "" + d.getDay();
    const uploadPath = path.join(__dirname, "..", "public", "upload", year, month, day);
    fs.mkdirSync(uploadPath, {recursive: true});
    return path.join("public", "upload", year, month, day);
}

// Function to create a link for file access
function createLink(fileAddress, req) {
    if (fileAddress) {
        const normalizedAddress = fileAddress.replace(/\\/g, "/");
        if (/^https?:\/\//.test(normalizedAddress)) {
            return normalizedAddress.replace('/public/', '/');
        } else {
            const cleanAddress = normalizedAddress.replace(/^public\//, '');
            return `${req.protocol}://${req.get("host")}/${cleanAddress}`;
        }
    } else {
        return undefined;
    }
}

module.exports = {
    SignAccessToken,
    SignRefreshToken,
    HashString,
    createUploadPath,
    createLink
};
