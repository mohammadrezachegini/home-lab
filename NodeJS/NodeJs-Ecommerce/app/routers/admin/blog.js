const { uploadFile } = require('../../../utils/multer');
const { AdminBlogController } = require('../../http/controllers/admin/blog/blog.controller');
const { StringToArray } = require('../../http/middleware/StringToArray');

const router = require('express').Router();

router.get("/", AdminBlogController.getAllBlogs)
router.post("/add", uploadFile.single("image"), StringToArray("tags") , AdminBlogController.createBlog)
router.patch("/update/:id", uploadFile.single("image"), StringToArray("tags") , AdminBlogController.updateBlogById)
router.get("/:id", AdminBlogController.getBlogById)
router.delete("/:id", AdminBlogController.deleteBlogById)

module.exports = {
    BlogAdminApiRoutes: router
}