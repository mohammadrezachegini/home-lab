const { CategoryAdminApiRoutes } = require("../admin/category")
const { BlogAdminApiRoutes } = require("../admin/blog")
const { ProductAdminApiRoutes } = require("../admin/product")
const { CourseAdminApiRoutes } = require("./course")
const { ChapterAdminApiRoutes } = require("./chapter")
const { EpisodeAdminApiRoutes } = require("./episode")
const { UserAdminApiRoutes } = require("./user")
const { PermissionAdminApiRoutes } = require("./permission")
const { RoleAdminApiRoutes } = require("./role")
const { checkPermission } = require("../../http/middleware/permission.guard")
const { PERMISSIONS } = require("../../../utils/constans")

const router = require("express").Router()


router.use("/category",checkPermission([PERMISSIONS.CONTENT_MANAGER]), CategoryAdminApiRoutes)
router.use("/blogs" , checkPermission([PERMISSIONS.TEACHER]),
BlogAdminApiRoutes)
router.use("/products", checkPermission([PERMISSIONS.SUPPLIER,
    PERMISSIONS.CONTENT_MANAGER
]), ProductAdminApiRoutes)
router.use("/courses", checkPermission([PERMISSIONS.TEACHER]), CourseAdminApiRoutes)
router.use("/chapters", checkPermission([PERMISSIONS.TEACHER]),ChapterAdminApiRoutes)
router.use("/episodes", checkPermission([PERMISSIONS.TEACHER]),EpisodeAdminApiRoutes)
router.use("/users",checkPermission([PERMISSIONS.USER]), UserAdminApiRoutes)
router.use("/permissions", checkPermission([PERMISSIONS.ADMIN]), PermissionAdminApiRoutes)
router.use("/roles",checkPermission(PERMISSIONS.ADMIN),
RoleAdminApiRoutes)

module.exports = {
    AdminRoutes: router
}