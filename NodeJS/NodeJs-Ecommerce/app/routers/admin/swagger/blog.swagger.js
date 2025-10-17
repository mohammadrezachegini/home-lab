

/**
 * @swagger
 *  components:
 *      schemas:
 *         Blog:
 *           type: object
 *           required:
 *              -  title
 *              -  short_text
 *              -  text
 *              -  tags
 *              -  category
 *              -  image
 *           properties:
 *              title:
 *                  type: string
 *                  description: Enter the blog title
 *              short_text:
 *                  type: string
 *                  description: Enter the short text
 *              text:
 *                  type: string
 *                  description: Enter the text
 *              tags:
 *                  type: string
 *                  description: Enter the tags
 *              category:
 *                  type: string
 *                  description: Enter the category
 *              image:
 *                  type: file
 *                  description: upload the image
 */






/**
 * @swagger
 *  /admin/blogs:
 *      get:
 *          summary: get all Blogs
 *          tags: [Blog(AdminPanel)] 
 *          description :  get all blogs
 *          responses:
 *              200:
 *                  description : success
 *             
*/

/**
 * @swagger
 *  /admin/blogs/update/{id}:
 *      patch:
 *          tags: [Blog(AdminPanel)] 
 *          description : add blog
 *          summary: Create Blog
 *          consumes:
 *              - multipart/form-data
 *              - application/x-www-form-data-urlencoded
 *          parameters:
 *              -   in: formData
 *                  type: string
 *                  name: title
 *              -   in: path
 *                  type: string
 *                  name: id
 *                  required: true
 *              -   in: formData
 *                  type: string
 *                  name: short_text  
 *              -   in: formData
 *                  name: text  
 *                  type: string
 *              -   in: formData
 *                  example: tags1#tags2#tags3#foo#foo_bar || str || undefined
 *                  type: string
 *                  name: tags
 *              -   in: formData
 *                  type: string
 *                  name: category   
 *              -   in: formData
 *                  type: file
 *                  name: image    
 *          responses:
 *              201:
 *                  description : success
 *             
*/


/**
 * @swagger
 *  /admin/blogs/add:
 *      post:
 *          tags: [Blog(AdminPanel)] 
 *          description : add blog
 *          summary: Create Blog
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Blog'
 *                  application/x-www-form-urlencoded:
 *                      schema:
 *                          $ref: '#/components/schemas/Blog'
 *          responses:
 *              201:
 *                  description : success
 *             
*/

/**
 * @swagger
 *  /admin/blogs/{id}:
 *      get:
 *          tags: [Blog(AdminPanel)] 
 *          description : add blog
 *          summary: Create Blog
 *          consumes:
 *              - multipart/form-data
 *              - application/x-www-form-data-urlencoded
 *          parameters:
 *              -   in: path
 *                  required: true
 *                  type: string
 *                  name: id
 *          responses:
 *              201:
 *                  description : success
 *             
*/

/**
 * @swagger
 *  /admin/blogs/{id}:
 *      delete:
 *          tags: [Blog(AdminPanel)] 
 *          description : add blog
 *          summary: Create Blog
 *          consumes:
 *              - multipart/form-data
 *              - application/x-www-form-data-urlencoded
 *          parameters:
 *              -   in: path
 *                  required: true
 *                  type: string
 *                  name: id
 *          responses:
 *              201:
 *                  description : success
 *             
*/