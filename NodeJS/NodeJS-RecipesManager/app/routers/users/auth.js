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



/**
 * @swagger
 *  /user/{id}:
 *    get:
 *      summary: Get user by ID
 *      tags: [User-Authentication]
 *      description: Retrieve user information by user ID
 *      parameters:
 *        - in: path
 *          name: id
 *          description: User ID
 *          required: true
 *          schema:
 *            type: string
 *          example: 60c21a40c7b5f548c49d47d1
 *      responses:
 *        200:
 *          description: Success
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: number
 *                    description: HTTP status code
 *                    example: 200
 *                  success:
 *                    type: boolean
 *                    description: Indicates whether the request was successful
 *                    example: true
 *                  user:
 *                    type: object
 *                    description: User information
 *                    properties:
 *                      _id:
 *                        type: string
 *                        description: User ID
 *                      first_name:
 *                        type: string
 *                        description: First name of the user
 *                      last_name:
 *                        type: string
 *                        description: Last name of the user
 *                      email:
 *                        type: string
 *                        description: Email address of the user
 *                      createdAt:
 *                        type: string
 *                        format: date-time
 *                        description: Date and time when the user was created
 *                      updatedAt:
 *                        type: string
 *                        format: date-time
 *                        description: Date and time when the user was last updated
 *        404:
 *          description: User not found
 *        500:
 *          description: Internal Server Error
*/
router.get("/:id", authController.getUserById);

module.exports = {
    userAuthRoutes: router
}