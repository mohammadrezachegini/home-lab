
/**
 * @swagger
 *  components:
 *      schemas:
 *         GetOtp:
 *           type: object
 *           required:
 *              -  mobile
 *           properties:
 *              mobile:
 *                  type: string
 *                  description: CA phone number for sign in and sign up
 *         CheckOtp:
 *          type: object
 *          required:
 *              -   mobile
 *              -   code
 *          properties:
 *             mobile:
 *              type: string
 *              description: CA phone number for sign in and sign up
 *             code:
 *              type: string
 *              description: received code for get OTP
 *         RefreshToken:
 *          type: object
 *          required:
 *              -   refreshToken
 *          properties:
 *             refreshToken:
 *              type: string
 *              description: enter old token to get new refresh token and refresh token
 */




/**  
 * @swagger
 * tags: 
 *  name: User-Authentication
 *  description : User authentication section
 *      
*/

/**
 * @swagger
 *  /user/get-otp: 
 *      post:
 *          summary: get the otp codes
 *          tags: [User-Authentication] 
 *          description :  get the otp code for authentication
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/GetOtp'
 *                  application/x-www-form-urlencoded:
 *                      schema:
 *                          $ref: '#/components/schemas/GetOtp'
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




/**
 * @swagger
 *  /user/check-otp:
 *      post:
 *          summary: check the otp code
 *          tags: [User-Authentication] 
 *          description :  check the otp code for authentication
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/CheckOtp'
 *                  application/x-www-form-urlencoded:
 *                      schema:
 *                          $ref: '#/components/schemas/CheckOtp'
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


/**
 * @swagger
 *  /user/refresh-token:
 *      post:
 *          summary: send refresh token to get new token and refresh token
 *          tags: [User-Authentication] 
 *          description :  Refresh Token
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/RefreshToken'
 *                  application/x-www-form-urlencoded:
 *                      schema:
 *                          $ref: '#/components/schemas/RefreshToken'
 *         
 *          responses:
 *              200:
 *                  description : success
 *             
*/