
/**
 * @swagger
 *  components:
 *      schemas:
 *          Update-Profile:
 *              type: object
 *              properties:
 *                  first_name:
 *                      type: string
 *                      description: the first_name of user
 *                  last_name:
 *                      type: string
 *                      description: the last_name of user
 *                  email:
 *                      type: string
 *                      description: the email of user
 *                  username:
 *                      type: string
 *                      description: the username of user
 *                      
 */

/**
 * @swagger
 *  definitions:
 *      ListOfUsers:
 *          type: object
 *          properties:
 *              statusCode: 
 *                  type: integer
 *                  example: 200
 *              data:
 *                  type: object
 *                  properties:
 *                      users:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  _id:
 *                                      type: string
 *                                  first_name:
 *                                      type: string
 *                                  last_name:
 *                                      type: string
 *                                  username:
 *                                      type: string
 *                                  email:
 *                                      type: string
 *                                  mobile:
 *                                      type: string
 */
/**
 * @swagger
 *  /admin/users/list:
 *      get:
 *          tags: [User(AdminPanel)]
 *          summary: get All courses
 *          parameters:
 *              -   in: query
 *                  name: search
 *                  type: string
 *                  description: id for the course
 *          responses:
 *              200:
 *                  description : success
 *                  content:
 *                     application/json:
 *                          schema:
 *                              $ref: '#/definitions/ListOfCourses'
 * 
 */


/**
 * @swagger
 *  /admin/users/edit/{id}:
 *      patch:
 *          tags: [User(AdminPanel)]
 *          summary: update user detail and profile
 *          requestBody:
 *              required: true
 *              content:
 *                  application/x-www-form-urlencoded: 
 *                      schema:
 *                          $ref: '#/components/schemas/Update-Profile'
 *                  application/json: 
 *                      schema:
 *                          $ref: '#/components/schemas/Update-Profile'
 *          responses:
 *              200:
 *                  description: success
 *                  content:
 *                      application/json:
 *                          schema: 
 *                              $ref: '#/definitions/publicDefinition'
 */


/**
 * @swagger
 *  /admin/user/profile:
 *      get:
 *          tags: [User(AdminPanel)]
 *          summary: get user profile
 *          responses :
 *              200:
 *                  description: success
 */