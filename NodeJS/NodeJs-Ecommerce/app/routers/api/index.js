const HomeController = require("../../http/controllers/api/home.contollers");
const {VerifyAccessToken} = require("../../http/middleware/VerifyAccessToken")
const router = require("express").Router();



router.get("/", VerifyAccessToken, HomeController.indexPage)

module.exports = {
    HomeRoutes : router
}