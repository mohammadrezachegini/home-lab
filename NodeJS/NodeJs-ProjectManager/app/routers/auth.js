const router = require("express").Router();

const {authController} = require("../http/controllers/auth.controller");
const  {expressValidatorMapper}  = require("../http/middlewares/CheckErrors")
const  {registerValidator}  = require("../http/validations/auth")
const  {loginValidator}  = require("../http/validations/auth")

router.post("/register", registerValidator(), expressValidatorMapper, authController.register)
router.post("/login", loginValidator(), expressValidatorMapper, authController.login)

module.exports = {
    authRoutes: router
}   