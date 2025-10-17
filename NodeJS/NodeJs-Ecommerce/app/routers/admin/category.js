const router = require("express").Router();
const {CategoryController} = require("../../http/controllers/admin/category/category.controller");


router.post("/add", CategoryController.addCategory )
router.get("/parents",CategoryController.getAllCategoriesByParent )
router.get("/children/:parent",CategoryController.getAllChildCategory )
router.get("/all",CategoryController.getAllCategory )
router.delete("/remove/:id", CategoryController.removeCategory )
router.get("/list-of-all", CategoryController.getAllCategoriesWithoutPopulate )
router.get("/:id", CategoryController.getCategoryById )
router.patch("/update/:id", CategoryController.editCategory )



module.exports = {
    CategoryAdminApiRoutes: router
}