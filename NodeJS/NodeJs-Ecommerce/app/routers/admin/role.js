const { RoleController } = require("../../http/controllers/admin/RBAC/role.controller");
const { StringToArray } = require("../../http/middleware/StringToArray");

const router = require("express").Router();

router.get("/list", RoleController.getAllRoles)
router.post("/add", StringToArray("permissions") ,RoleController.createRole)
router.delete("/remove/:field", RoleController.removeRole)
router.patch("/edit/:id",StringToArray("permissions"), RoleController.editRoleById)

module.exports = {
    RoleAdminApiRoutes : router
}