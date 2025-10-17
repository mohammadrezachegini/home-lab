
/**
 * @swagger
 *  components:
 *      schemas:
 *          Types:
 *             Course:
 *             type: string
 *             enum:
 *                  -   Free
 *                  -   Cash
 *                  -   Special
 */ 

/**
 * @swagger
 * components:
 *  schemas:
 *      AddChapter:
 *          type: object
 *          required:
 *              -   id
 *              -   title
 *          properties:
 *              id:
 *                  type: string
 *              title:
 *                  type: string
 *              text:
 *                  type: string
 *      Course:
 *          type: object
 *          required:
 *              -   title
 *              -   short_desc
 *              -   full_desc
 *              -   tags
 *              -   category
 *              -   price
 *              -   discount
 *              -   image
 *              -   type
 *          properties:
 *
 *              title:
 *                  type: string
 *                  description: title of the course
 *              short_desc:
 *                  type: string
 *                  description: short description for the course
 *              full_desc:
 *                  type: string
 *                  description: full description for the course
 * 
 *              tags:
 *                  type: array
 *                  description: tags for the course
 * 
 *              category:
 *                  type: string
 *                  description: category for  course
 * 
 *              price:
 *                  type: string
 *                  description: price for the course
 * 
 *              discount:
 *                  type: string
 *                  description: discount for the course
 * 
 *              image:
 *                  type: file
 *                  format: binary
 *                  description: pictures of the product
 *              type:
 *                     $ref: '#/components/schemas/Types'
 *      EditProduct:
 *          type: object
 *          properties:
 *
 *              title:
 *                  type: string
 *                  description: title of the product
 *              short_text:
 *                  type: string
 *                  description: title of the product
 *              text:
 *                  type: string
 *                  description: text of the product
 * 
 *              tags:
 *                  type: array
 *                  description: tags of the product
 * 
 *              category:
 *                  type: string
 *                  description: category of the product
 * 
 *              price:
 *                  type: string
 *                  description: price of the product
 * 
 *              discount:
 *                  type: string
 *                  description: discount of the product
 *              images:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                  description: pictures of the product
 * 
 *              type:
 *                     $ref: '#/components/schemas/Types'

 * 
 */

/**
 * {
 *  statusCode: 200,
 *  data: {
 *      courses : [{}, {}, {}]
 *  }
 * }
 */
/**
 * @swagger
 *  definitions:
 *      ListOfCourses:
 *          type: object
 *          properties:
 *              statusCode: 
 *                  type: integer
 *                  example: 200
 *              data:
 *                  type: object
 *                  properties:
 *                      courses:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  _id:
 *                                      type: string
 *                                      example: "62822e4ff68cdded54aa928d"
 *                                  title:
 *                                      type: string
 *                                      example: "title of course"
 *                                  short_desc:
 *                                      type: string
 *                                      example: "summary text of course"
 *                                  full_desc:
 *                                      type: string
 *                                      example: "text and describe of course"
 *                                  status:
 *                                      type: string
 *                                      example: "notStarted | Completed | Holding"
 *                                  time:
 *                                      type: string
 *                                      example: "01:22:34"
 *                                  price:
 *                                      type: integer
 *                                      example: 250,000
 *                                  discount:
 *                                      type: integer
 *                                      example: 20
 *                                  Count:
 *                                      type: integer
 *                                      example: 340
 *                                  teacher:
 *                                      type: string
 *                                      example: "Reza Chegini"
 */


/**
 * @swagger
 *  /admin/courses/list:
 *      get:
 *          tags: [Course(AdminPanel)]
 *          summary: get All courses
 *          parameters:
 *              -   in: query
 *                  name: search
 *                  type: string
 *                  description: search in the the courses
 *          responses :
 *              200:
 *                  description: success
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: '#/definitions/ListOfCourses'
 */

/**
* @swagger
*  /admin/courses/add:
*      post:
*          tags: [Course(AdminPanel)]
*          summary: Add a new course
*          requestBody:
*              required: true
*              content:
*                      multipart/form-data:
*                          schema:
*                              $ref: '#/components/schemas/Course'
*          responses:
*              201:
*                  description: created new course
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/publicDefinition'
* 
*/


/**
 * @swagger
 *  /admin/courses/{id}:
 *      get:
 *          tags: [Course(AdminPanel)]
 *          summary: get All courses
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  type: string
 *                  description: id for the course
 *          responses:
 *              200:
 *                  description : success
 *                
 * 
 */



/**
* @swagger
*  /admin/courses/edit/{id}:
*      patch:
*          tags: [Course(AdminPanel)]
*          summary: Edit a  course
*          parameters:
*               -   in: path
*                   name: id
*                   type: string
*                   description: id for the course
*          requestBody:
*              required: true
*              content:
*                      multipart/form-data:
*                          schema:
*                              $ref: '#/components/schemas/EditCourse'
*          responses:
*              201:
*                  description: created new course
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/publicDefinition'
* 
*/
