const router = require('express').Router();
const { ChapterController } = require('../../http/controllers/admin/course/chapter.controller');


router.put("/add", ChapterController.addChapter)
router.get("/list/:id", ChapterController.getChapterById)
router.patch("/remove/:id", ChapterController.removeChapterById)
router.patch("/update/:id", ChapterController.updateChapterById)



module.exports = {
    ChapterAdminApiRoutes : router
}