const redisClient = require("../../utils/init_redis");
const { HomeRoutes }  = require("./api");
const { userAuthRoutes } = require("./user/auth");
const {DeveloperRoutes} = require("../routers/developers.routes");
const { AdminRoutes } = require("./admin/admin.routes");
const {VerifyAccessToken} = require("../../app/http/middleware/VerifyAccessToken")
const {checkRole} = require("../../app/http/middleware/permission.guard")

const router = require("express").Router();

(async() => {
    await redisClient.set("key", "value");
    const value = await redisClient.get("key");
    console.log(value);
})()

router.use("/user", userAuthRoutes)
router.use("/", HomeRoutes)
router.use("/developer", DeveloperRoutes)
router.use("/admin",VerifyAccessToken, AdminRoutes)

module.exports = {
    AllRoutes : router
}