/**
 * @swagger
 *  definitions:
 *      ListOfPermissions:
 *          type: object
 *          properties:
 *              statusCode: 
 *                  type: integer
 *                  example: 200
 *              data:
 *                  type: object
 *                  properties:
 *                      permissions:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  _id:
 *                                      type: string
 *                                      example: "62822e4ff68cdded54aa928d"
 *                                  title:
 *                                      type: string
 *                                      example: "title of permission"
 *                                  description:
 *                                      type: string
 *                                      example: "desc of permission"
 *                                          
 */
/**
 * @swagger
 *  components:
 *      schemas:
 *          Permissions:
 *             Permissions:
 *             type: string
 *             enum:
 *                  -   Blog
 *                  -   Course
 *                  -   Product
 */ 
/**
 * @swagger
 *  components:
 *      schemas:
 *         Permissions:
 *           type: object
 *           required:
 *              -  title
 *              -  description
 *           properties:
 *              title:
 *                  type: string
 *                  description: Enter the title of roles
 *              description:
 *                  type: string
 *                  description: Enter the permissions
 */


/**
 * @swagger
 *  components:
 *      schemas:
 *         EditPermissions:
 *           type: object
 *           properties:
 *              title:
 *                  type: string
 *                  description: Enter the title of roles
 *              description:
 *                  type: string
 *                  description: Enter the permissions
 */
/**
* @swagger
*  /admin/permissions/add:
*      post:
*          tags: [RBAC(AdminPanel)]
*          summary: Add a new course
*          requestBody:
*              required: true
*              content:
*                      application/x-www-form-urlencoded:
*                          schema:
*                              $ref: '#/components/schemas/Permissions'
*          responses:
*              201:
*                  description: created new Role
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/publicDefinition'
* 
*/

/**
* @swagger
*  /admin/permissions/edit/{id}:
*      patch:
*          tags: [RBAC(AdminPanel)]
*          summary: Edit Role
*          parameters:
*              -    in: path
*                   name: id
*                   type: string
*                   required: true
*          requestBody:
*              required: true
*              content:
*                      application/x-www-form-urlencoded:
*                          schema:
*                              $ref: '#/components/schemas/EditPermissions'
*          responses:
*              201:
*                  description: created new Role
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/publicDefinition'
* 
*/







/**
* @swagger
*  /admin/permissions/list:
*      get:
*          tags: [RBAC(AdminPanel)]
*          summary: Add a new course
*          responses:
*              200:
*                  description: created new Role
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/ListOfPermissions'
* 
*/



/**
* @swagger
*  /admin/permissions/remove/{id}:
*      delete:
*          tags: [RBAC(AdminPanel)]
*          summary: Edit Role
*          parameters:
*              -    in: path
*                   name: id
*                   type: string
*                   required: true
*          responses:
*              201:
*                  description: created new Role
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/publicDefinition'
* 
*/