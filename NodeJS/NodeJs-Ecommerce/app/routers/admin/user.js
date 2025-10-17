const { UserController } = require("../../http/controllers/admin/user/user.controller");
const { checkPermission } = require("../../http/middleware/permission.guard");
const { PERMISSIONS } = require("../../../utils/constans");
const router = require("express").Router();

router.get("/list", checkPermission([PERMISSIONS.ADMIN]),UserController.getAllUsers)
router.patch("/edit/:id", UserController.updateUserProfileById)
router.get("/profile",checkPermission([]), UserController.userProfile)


module.exports = {

    UserAdminApiRoutes : router
}