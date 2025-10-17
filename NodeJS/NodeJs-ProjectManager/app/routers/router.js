const { authRoutes } = require("./auth");
const { projectRoutes } = require("./project");
const { teamRoutes } = require("./team");
const { userRoutes } = require("./user");

const router = require("express").Router();

router.use("/project", projectRoutes)
router.use("/team", teamRoutes)
router.use("/auth", authRoutes)
router.use("/user", userRoutes)

module.exports = {
    AllRoutes: router
}