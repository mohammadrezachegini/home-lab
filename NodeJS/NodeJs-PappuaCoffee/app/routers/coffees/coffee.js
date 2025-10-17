const router = require("express").Router();
const {CoffeeController} = require("../../http/controllers/coffee/coffee.controller");
const { uploadFile } = require("../../../utils/express-fileUpload");
const fileupload = require("express-fileupload");
const {mongoIDValidator} = require("../../http/validations/public")






/**  
 * @swagger
 * tags: 
 *  name: Coffees
 *  description : User authentication section
 *      
*/

/**
 * @swagger
 *  /coffee/create:
 *      post:
 *          summary: register user
 *          tags: [Coffees] 
 *          description :  register user
 *          parameters:
 *          -   name: product_name
 *              description: Product Name
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: description
 *              description: description
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: price
 *              description: price
 *              in: formData
 *              required: true
 *              type: string  
 *          -   name: image
 *              description: image
 *              in: formData
 *              required: true
 *              type: file         
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

router.post("/create", fileupload(),uploadFile, CoffeeController.createCoffee)
/**
 * @swagger
 *  /coffee/list:
 *      get:
 *          summary: get All coffees
 *          tags: [Coffees] 
 *          description :  get All coffees
 *                
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
router.get("/list", CoffeeController.getAllCoffee)
/**
 * @swagger
 *  /coffee/{id}:
 *      get:
 *          summary: get coffee by id
 *          tags: [Coffees] 
 *          description :  get coffee by id
 *          parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            type: string  
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
router.get("/:id", mongoIDValidator(), CoffeeController.getCoffeeById)

/**
 * @swagger
 * /coffee/remove/{id}:
 *  delete:
 *      description: Delete coffee by id
 *      tags: [Coffees] 
 *      parameters:
 *        - in: path
 *          name: id
 *          schema:
 *              type: string
 *          required: true
 *          description: string id of user to delete
 *      responses:
 *          200:
 *              description: User that was deleted
 */


router.delete("/remove/:id", mongoIDValidator(), CoffeeController.removeCoffee)


/**  
 * @swagger
 * tags: 
 *  name: Coffees
 *  description : User authentication section
 *      
*/



/**
 * @swagger
 * /coffee/edit/{id}:
 *   put:
 *     summary: Update a coffee by ID
 *     tags: [Coffees] 
 *     description: Update a user's name and email address by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: string
 *       - in: body
 *         name: coffee
 *         description: The updated user object.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             product_name:
 *               type: string
 *             price:
 *               type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Not Found
 *       '500':
 *         description: Internal Server Error
 */
router.put("/edit/:id", CoffeeController.updateCoffee)


/**
 * @swagger
 * /coffee/edit-coffeeImage/{id}:
 *   patch:
 *     summary: Update a coffee image by ID
 *     tags: [Coffees] 
 *     description: Update a user's name and email address by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: string
 *       - in: body
 *         name: coffee
 *         description: The updated user object.
 *         required: true
 *         schema:
 *           type: file
 *           properties:
 *             image:
 *               in: formData
 *               type: file
 * 
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Not Found
 *       '500':
 *         description: Internal Server Error
 */
router.patch("/edit-coffeeImage/:id", fileupload(),uploadFile , mongoIDValidator(), CoffeeController.updateCoffeeImage)



// /**  
//  * @swagger
//  * tags: 
//  *  name: User-Authentication
//  *  description : User authentication section
//  *      
// */

// /**
//  * @swagger
//  *  /user/register:
//  *      post:
//  *          summary: register user
//  *          tags: [User-Authentication] 
//  *          description :  register user
//  *          parameters:
//  *          -   name: first_name
//  *              description: First Name
//  *              in: formData
//  *              required: true
//  *              type: string  
//  *          -   name: last_name
//  *              description: last_name
//  *              in: formData
//  *              required: true
//  *              type: string  
//  *          -   name: email
//  *              description: Email
//  *              in: formData
//  *              required: true
//  *              type: string  
//  *          -   name: password
//  *              description: Password
//  *              in: formData
//  *              required: true
//  *              type: string         
//  *          responses:
//  *              201:
//  *                  description : success
//  *              400:
//  *                  description: Bad Request
//  *              401:
//  *                  description: Unauthorization
//  *              500:
//  *                  description: internal Server Error
// */


// router.post("/register", authController.register)



// /**
//  * @swagger
//  *  /user/login:
//  *      post:
//  *          summary: login
//  *          tags: [User-Authentication] 
//  *          description :  login
//  *          parameters:
//  *          -   name: email
//  *              description: Enter the email
//  *              in: formData
//  *              required: true
//  *              type: string
//  *          -   name: password
//  *              description: Enter the password
//  *              in: formData
//  *              required: true
//  *              type: string         
//  *          responses:
//  *              201:
//  *                  description : success
//  *              400:
//  *                  description: Bad Request
//  *              401:
//  *                  description: Unauthorization
//  *              500:
//  *                  description: internal Server Error
// */

// router.post("/login",authController.login)


// /**
//  * @swagger
//  *  /user/refresh-token:
//  *      post:
//  *          summary: send refresh token to get new token and refresh token
//  *          tags: [User-Authentication] 
//  *          description :  Refresh Token
//  *          parameters:
//  *              -   in: body
//  *                  required: true
//  *                  type: string
//  *                  name: refreshToken    
//  *          responses:
//  *              200:
//  *                  description : success
//  *             
// */

// router.post("/refresh-token",authController.refreshToken)

module.exports = {
    coffeeRoutes: router
}