const router = require("express").Router();
const {ProjectController} = require("../http/controllers/project.controller");
const { checkLogin } = require("../http/middlewares/autoLogin");
const { expressValidatorMapper } = require("../http/middlewares/CheckErrors");
const { createProjectValidator } = require("../http/validations/project");
const { uploadFile } = require("../modules/express-fileUpload");
const fileupload = require("express-fileupload");
const {mongoIDValidator} = require("../http/validations/public")

router.post("/create", fileupload(), checkLogin, uploadFile  ,createProjectValidator(), expressValidatorMapper , ProjectController.createProject)
router.get("/list",  checkLogin , ProjectController.getAllProjects)
router.get("/:id",  checkLogin , mongoIDValidator(), expressValidatorMapper, ProjectController.getProjectById)
router.delete("/remove/:id",  checkLogin , mongoIDValidator(), expressValidatorMapper, ProjectController.removeProject)
router.put("/edit/:id",  checkLogin , mongoIDValidator(), expressValidatorMapper, ProjectController.updateProject)
router.patch("/edit-projectImage/:id", fileupload(), checkLogin, uploadFile , mongoIDValidator(), expressValidatorMapper, ProjectController.updateProjectImage)



module.exports = {
    projectRoutes: router
}