const router = require("express").Router();
const {TeamController} = require("../http/controllers/team.controller")
const {checkLogin} = require("../http/middlewares/autoLogin")
const {createTeamnValidator} = require("../http/validations/team")
const {expressValidatorMapper} = require("../http/middlewares/CheckErrors")
const {mongoIDValidator} = require("../http/validations/public")


router.post("/create", checkLogin, createTeamnValidator(), expressValidatorMapper, TeamController.createTeam)
router.get("/list", checkLogin, TeamController.getListOfTeam)
router.get("/me", checkLogin, TeamController.getMyTeam)
router.get("/invite/:teamID/:username", checkLogin, TeamController.inviteUserToTeam)
router.put("/update/:teamID", checkLogin, TeamController.updateTeam)
router.get("/:id", checkLogin,  mongoIDValidator(), expressValidatorMapper, TeamController.getTeamById)
router.delete("/remove/:id", checkLogin,  mongoIDValidator(), expressValidatorMapper, TeamController.removeTeamById)

// router.get()

module.exports = {
    teamRoutes: router
}