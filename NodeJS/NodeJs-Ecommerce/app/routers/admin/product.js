const { uploadFile } = require("../../../utils/multer");
const { ProductController } = require("../../http/controllers/admin/product/product.controller");
const { StringToArray } = require("../../http/middleware/StringToArray");

const router = require("express").Router();


router.post("/add", uploadFile.array("images", 10), StringToArray("tags","colors") ,ProductController.addProduct)
router.get("/list",ProductController.getAllProducts)
router.get("/:id",ProductController.getProductById)
router.delete("/remove/:id",ProductController.removeProductById)
router.patch("/edit/:id", uploadFile.array("images", 10) ,ProductController.editProduct)

module.exports = {
    ProductAdminApiRoutes : router
}