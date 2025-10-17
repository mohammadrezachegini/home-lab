const {authController} = require("../../http/controllers/user/auth/auth.controller")
const { VerifyAccessToken } = require("../../http/middlewares/VerifyAccessToken")

const router = require("express").Router()


/**  
 * @swagger
 * tags: 
 *  name: User-Authentication
 *  description : User authentication section
 *      
*/

/**
 * @swagger
 *  /user/register:
 *      post:
 *          summary: register user
 *          tags: [User-Authentication] 
 *          description :  register user
 *          parameters:
 *          -   name: first_name
 *              description: First Name
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: last_name
 *              description: last_name
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: email
 *              description: Email
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: password
 *              description: Password
 *              in: formData
 *              required: true
 *              type: string         
 *          responses:
 *              201:
 *                  description : success
 *              400:
 *                  description: Bad Request
 *              401:
 *                  description: Unauthorization
 *              500:
 *                  description: internal Server Error
*/


router.post("/register", authController.register)



/**
 * @swagger
 *  /user/login:
 *      post:
 *          summary: login
 *          tags: [User-Authentication] 
 *          description :  login
 *          parameters:
 *          -   name: email
 *              description: Enter the email
 *              in: formData
 *              required: true
 *              type: string
 *          -   name: password
 *              description: Enter the password
 *              in: formData
 *              required: true
 *              type: string         
 *          responses:
 *              201:
 *                  description : success
 *              400:
 *                  description: Bad Request
 *              401:
 *                  description: Unauthorization
 *              500:
 *                  description: internal Server Error
*/

router.post("/login",authController.login)


/**
 * @swagger
 *  /user/refresh-token:
 *      post:
 *          summary: send refresh token to get new token and refresh token
 *          tags: [User-Authentication] 
 *          description :  Refresh Token
 *          parameters:
 *              -   in: body
 *                  required: true
 *                  type: string
 *                  name: refreshToken    
 *          responses:
 *              200:
 *                  description : success
 *             
*/

// router.post("/refresh-token",authController.refreshToken)





/**
 * @swagger
 *  /user/logout:
 *      post:
 *          summary: logout
 *          tags: [User-Authentication] 
 *          description :  logout
 *          parameters:
 *          -   name: refreshToken
 *              description: Enter the refreshToken
 *              in: formData
 *              required: true
 *              type: string
 *          -   name: userId
 *              description: Enter the userId
 *              in: formData
 *              required: true
 *              type: string           
 *          responses:
 *              201:
 *                  description : success
 *              400:
 *                  description: Bad Request
 *              401:
 *                  description: Unauthorization
 *              500:
 *                  description: internal Server Error
*/

router.post("/logout",authController.logout)


module.exports = {
    userAuthRoutes: router
}