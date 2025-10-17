
/**
 * @swagger
 *  components:
 *      schemas:
 *          Color:
 *              type: array
 *              items: 
 *                  type: string
 *                  enum:
 *                      -   black
 *                      -   white
 *                      -   gray                
 *                      -   red
 *                      -   blue
 *                      -   green
 *                      -   orange
 *                      -   purple
 */ 

/**
 * @swagger
 *  components:
 *      schemas:
 *          Type:
 *              type: array
 *              items: 
 *                  type: string
 *                  enum:
 *                      -   Virtual
 *                      -   Physical
 */ 

/**
 * @swagger
 * components:
 *  schemas:
 *      Product:
 *          type: object
 *          required:
 *              -   title
 *              -   short_text
 *              -   text
 *              -   tags
 *              -   category
 *              -   price
 *              -   discount
 *              -   count
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
 * 
 *              count:
 *                  type: string
 *                  description: count of the product
 *              weight:
 *                  type: string
 *                  description: weight of the product
 *              height:
 *                  type: string
 *                  description: height of the product
 *              length:
 *                  type: string
 *                  description: length of the product
 * 
 *              width:
 *                  type: string
 *                  description: width of the product
 * 
 *              images:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                  description: pictures of the product
 *              type:
 *                     $ref: '#/components/schemas/Type'
 *              colors:
 *                     $ref: '#/components/schemas/Color' 
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
 * 
 *              count:
 *                  type: string
 *                  description: count of the product
 *              weight:
 *                  type: string
 *                  description: weight of the product
 *              height:
 *                  type: string
 *                  description: height of the product
 *              length:
 *                  type: string
 *                  description: length of the product
 * 
 *              width:
 *                  type: string
 *                  description: width of the product
 * 
 *              images:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                  description: pictures of the product
 * 
 *              type:
 *                     $ref: '#/components/schemas/Type'
 *              colors:
 *                     $ref: '#/components/schemas/Color'  
 */
/**
 * @swagger
 *  /admin/products/add:
 *      post:
 *          tags: [Product(AdminPanel)]
 *          summary: Add a new product
 *          requestBody:
 *              required: true
 *              content:
 *                      multipart/form-data:
 *                          schema:
 *                              $ref: '#/components/schemas/Product'
 *          responses:
 *              201:
 *                  description : success
 *                
 * 
 */

/**
 * @swagger
 *  /admin/products/list:
 *      get:
 *          tags: [Product(AdminPanel)]
 *          summary: get All products
 *          parameters:
 *              -   in: query
 *                  name: search
 *                  type: string
 *                  description: search of the product
 *          responses:
 *              201:
 *                  description : success
 *                
 * 
 */

/**
 * @swagger
 *  /admin/products/{id}:
 *      get:
 *          tags: [Product(AdminPanel)]
 *          summary: get one product
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  type: string
 *                  description: id of the product
 *          responses:
 *              201:
 *                  description : success
 *                
 * 
 */



/**
 * @swagger
 *  /admin/products/remove/{id}:
 *      delete:
 *          tags: [Product(AdminPanel)]
 *          summary: delete one product
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  type: string
 *                  description: id of the product
 *          responses:
 *              201:
 *                  description : success
 *                
 * 
 */



/**
 * @swagger
 *  /admin/products/edit/{id}:
 *      patch:
 *          tags: [Product(AdminPanel)]
 *          summary: Edit a new product
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  type: string
 *                  required: true
 *                  description: id of the product
 *          requestBody:
 *              required: true
 *              content:
 *                      multipart/form-data:
 *                          schema:
 *                              $ref: '#/components/schemas/EditProduct'
 *          responses:
 *              200:
 *                  description : success
 *                
 * 
 */