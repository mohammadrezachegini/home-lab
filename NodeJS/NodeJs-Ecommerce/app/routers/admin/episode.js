const { uploadVideo } = require("../../../utils/multer");
const { EpisodeController } = require("../../http/controllers/admin/course/episode.controller");

const router = require("express").Router();

router.post("/add", uploadVideo.single("video"), EpisodeController.addEpisode)
router.delete("/remove/:id", EpisodeController.removeEpisodeByID)
router.patch("/edit/:id",uploadVideo.single("video"), EpisodeController.EditEpisodeByID)

module.exports = {
    EpisodeAdminApiRoutes : router
}