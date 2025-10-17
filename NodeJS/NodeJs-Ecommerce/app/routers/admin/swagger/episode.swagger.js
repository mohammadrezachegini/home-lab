/**
 * @swagger
 * components:
 *  schemas:
 *      AddEpisode:
 *          type: object
 *          required:
 *              -   courseID
 *              -   chapterID
 *              -   title
 *              -   text
 *              -   video
 *              -   type
 *          properties:
 *              courseID:
 *                  type: string
 *              chapterID:
 *                  type: string
 *              title:
 *                  type: string
 *              text:
 *                  type: string
 *              video:
 *                  type: string
 *                  format: binary
 *              type:
 *                  type: string
 *                  enum:
 *                     - lock
 *                     - unlock
 *      EditEpisode:
 *          type: object
 *          properties:
 *              title:
 *                  type: string
 *              text:
 *                  type: string
 *              video:
 *                  type: string
 *                  format: binary
 *              type:
 *                  type: string
 *                  enum:
 *                     - lock
 *                     - unlock

 */





/**
 * @swagger
 *  /admin/episodes/add:
 *      post:
 *          tags: [Episode(AdminPanel)]
 *          summary: add a new episode
 *          requestBody:
 *              required: true
 *              content: 
 *                      multipart/form-data:
 *                          schema:
 *                             $ref: '#/components/schemas/AddEpisode'  
 *          responses:
 *                  201:
 *                    description : success
 *          content:
 *                  application/json:
 *                     schema:
 *                        $ref: '#/definitions/publicDefinition'  
 * 
 */



/**
 * @swagger
 *  /admin/episodes/remove/{id}:
 *      delete:
 *          tags: [Episode(AdminPanel)]
 *          summary: remove a  episode
 *          parameters:
 *             -    in: path
 *                  name: id
 *                  type: string
 *                  required: true
 *          responses:
 *                  200:
 *                    description : success
 *          content:
 *                  application/json:
 *                     schema:
 *                        $ref: '#/definitions/publicDefinition'  
 * 
 */


/**
 * @swagger
 *  /admin/episodes/edit/{id}:
 *      patch:
 *          tags: [Episode(AdminPanel)]
 *          summary: edit a episode
 *          parameters:
 *             -    in: path
 *                  name: id
 *                  type: string
 *                  required: true
 *          requestBody:
 *              required: true
 *              content: 
 *                      multipart/form-data:
 *                          schema:
 *                             $ref: '#/components/schemas/EditEpisode'  
 *          responses:
 *                  201:
 *                    description : success
 *          content:
 *                  application/json:
 *                     schema:
 *                        $ref: '#/definitions/publicDefinition'  
 * 
 */
