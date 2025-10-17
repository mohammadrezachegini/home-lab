
/**
 * @swagger
 *  definitions:
 *      ListOfRoles:
 *          type: object
 *          properties:
 *              statusCode: 
 *                  type: integer
 *                  example: 200
 *              data:
 *                  type: object
 *                  properties:
 *                      role:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  _id:
 *                                      type: string
 *                                      example: "62822e4ff68cdded54aa928d"
 *                                  title:
 *                                      type: string
 *                                      example: "title of role"
 *                                  description:
 *                                      type: string
 *                                      example: "desc of role"
 *                                  permission:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  example: "62822e4ff68cdded54aa928d"
 *                                              title:
 *                                                  type: string
 *                                                  example: "title of permission"
 *                                              description:
 *                                                  type: string
 *                                                  example: "describe the permission"
 *                                          
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *         Role:
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
 *                  description: Enter the description of roles
 *              permissions:
 *                  type: array
 *                  description: Enter the permissions
 */


/**
 * @swagger
 *  components:
 *      schemas:
 *         EditRole:
 *           type: object
 *           properties:
 *              title:
 *                  type: string
 *                  description: Enter the title of roles
 *              description:
 *                  type: string
 *                  description: Enter the description of roles
 *              permissions:
 *                  type: array
 *                  description: Enter the permissions
 */
/**
* @swagger
*  /admin/roles/add:
*      post:
*          tags: [RBAC(AdminPanel)]
*          summary: Add a new course
*          requestBody:
*              required: true
*              content:
*                      application/x-www-form-urlencoded:
*                          schema:
*                              $ref: '#/components/schemas/Role'
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
*  /admin/roles/edit/{id}:
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
*                              $ref: '#/components/schemas/EditRole'
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
*  /admin/roles/list:
*      get:
*          tags: [RBAC(AdminPanel)]
*          summary: Add a new course
*          responses:
*              200:
*                  description: created new Role
*                  content:
*                      application/json:
*                          schema:
*                              $ref: '#/definitions/ListOfRoles'
* 
*/



/**
* @swagger
*  /admin/roles/remove/{field}:
*      delete:
*          tags: [RBAC(AdminPanel)]
*          summary: Remove Role
*          parameters:
*              -    in: path
*                   name: field
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