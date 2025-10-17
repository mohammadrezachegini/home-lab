
const Controller = require('../../controllers');
const {StatusCodes: HttpStatus} = require('http-status-codes')
const path = require('path');
const createHttpError = require('http-errors');
const { default: mongoose } = require('mongoose');
const {CourseModel} = require('../../../../models/course');
const { deleteInvalidPropertyInObject } = require('../../../../../utils/function');
class ChapterController extends Controller {


    async addChapter(req, res, next) {
        try {
            const {id, title, text} = req.body;
            const course = await CourseModel.findById(id);
            if(!mongoose.isValidObjectId(id)) throw createHttpError.BadRequest("Invalid course id")
            if(!course) throw createHttpError.NotFound('Course not found')
            const savedChapterResult = await CourseModel.updateOne({_id: id}, {
                $push: {
                    chapters: {
                        title,
                        text,
                        episodes: []
                    }
                }
            })
            if(savedChapterResult.modifiedCount == 0 ) throw createHttpError.InternalServerError('Chapter not added')
            
            return res.status(HttpStatus.CREATED).json({
                statusCode:HttpStatus.CREATED,
                
                data:{
                    message: 'Chapter added successfully',
                    course,
                    savedChapterResult
                }
            })
        } catch (error) {
            next(error);
        }
    }


    async getChapterById(req, res, next) {
        try {
            const {id} = req.params;
            const course = await this.getChaptersOfCourse(id)
            return res.status(HttpStatus.OK).json({
                statusCode:HttpStatus.OK,
                
                data:{
                    message: 'Chapter found successfully',
                    course,
                }
            })
        } catch (error) {
            next(error);
        }
    }

    async removeChapterById(req, res, next) {
        try {
            const {id} = req.params;
            const chapter = await this.getOneChapter(id)
            const removeChapterResult = await CourseModel.updateOne({"chapters._id": id}, {
                $pull: {
                    chapters: {
                        _id: id
                    }
                } 
            })
            if(removeChapterResult.modifiedCount == 0 ) throw createHttpError.InternalServerError('chapter not removed')
            return res.status(HttpStatus.OK).json({
                statusCode:HttpStatus.OK,

                data:{
                    message: 'Chapter removed successfully',
                    chapter,
                }
            })

        } catch (error) {
            next(error);
        }
    }

    async updateChapterById(req, res, next) {
        try {

            const {id} = req.params;
            console.log("chapter idddddddddd :::::::: " + id)
            await this.getOneChapter(id)
            const data = req.body;
            console.log("data is daataaaaaa :::::::: " + data)
            deleteInvalidPropertyInObject(data, ["_id"])
            const updateChapterResult = await CourseModel.updateOne(
                {"chapters._id" : id}, 
                {$set : { "chapters.$" : data }}
            )

            if(updateChapterResult.modifiedCount === 0 ) throw new createHttpError.InternalServerError('updated chapter is not successful')
            return res.status(HttpStatus.OK).json({
                statusCode:HttpStatus.OK,
                data:{
                    message: 'Chapter updated successfully',
                    updateChapterResult,
                    
                }
            })
        } catch (error) {
            next(error);
        }
    }

    async getChaptersOfCourse(id){
        const chapters = await CourseModel.findOne({_id: id}, {chapters: 1, title: 1})
        if(!chapters) throw createHttpError.NotFound("course not found")
        return chapters
    }
    async getOneChapter(id) {
        console.log("id :::::::: " + id);
        const chapter = await CourseModel.findOne(
          { chapters: { $elemMatch: { _id: id } } }
        );
        console.log("chapter :::::::: " + chapter);
        if (!chapter) {
          throw new createHttpError.NotFound("Chapter not found");
        }
        const chapterData = chapter.chapters.find((chapter) => chapter._id.toString() === id);
        if (!chapterData) {
          throw new createHttpError.NotFound("Chapter data not found");
        }
        return chapterData;
      }
}

module.exports = {
    ChapterController : new ChapterController()
}