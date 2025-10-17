const { getVideoDurationInSeconds } = require('get-video-duration');
const { getTime, getVideoDuration, deleteInvalidPropertyInObject } = require("../../../../../utils/function")
const { createEpisodeSchema } = require("../../../validations/admin/course.schema")
const {StatusCodes:HttpStatus} = require("http-status-codes")
const Controller = require("../../controllers")
const { CourseModel } = require("../../../../models/course")
const createHttpError = require("http-errors")
const path = require("path")
const CircularJSON = require('circular-json');
const { ObjectIdValidator } = require("../../../validations/public.validator");
const episode = require('../../../../routers/admin/episode');

class EpisodeController extends Controller {
    
    async addEpisode(req, res, next) {
        try {
            const {title,text,type, chapterID, courseID, filename, fileUploadPath} = await createEpisodeSchema.validateAsync(req.body)
            const videoAddress = path.join(fileUploadPath, filename).replace(/\\/g, "/")
            console.log("VIDEO ADDRESS", videoAddress);
            const videoUrl = "http://localhost:5000/" + videoAddress
            console.log("VIDEO URL", videoUrl);
            const seconds = await getVideoDuration(videoUrl)
            console.log("SECONDS " + seconds);
            const time = getTime(seconds)
            console.log("TIME " + time);
            const episode = {

                title,
                text,
                type,
                time,
                videoAddress
            }
            console.log("EPISODE", episode);
            const createEpisodeResult = await CourseModel.updateOne({
                _id: courseID,
                "chapters._id": chapterID},
                {$push: {
                    "chapters.$.episodes": episode
                }})
            console.log("CREATE EPISODE RESULT", createEpisodeResult);
            if(createEpisodeResult.modifiedCount == 0) throw new createHttpError.InternalServerError("Episode not added")
            const serializedResult = CircularJSON.stringify(createEpisodeResult);

            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data:{
                    message: "Episode added successfully",
                    createEpisodeResult: serializedResult
                }
            })
        } catch (error) {
            next(error)
        }
    }
    async removeEpisodeByID(req, res, next) {
        try {
            const {id: id} = await ObjectIdValidator.validateAsync({id: req.params.id})
            
            const removeEpisodeResult = await CourseModel.updateOne({
                "chapters.episodes._id": id},
                {$pull: {
                    "chapters.$.episodes": {
                        _id : id
                    }
                }})
            if(removeEpisodeResult.modifiedCount == 0) throw new createHttpError.InternalServerError("Episode not deleted")

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data:{
                    message: "Episode deleted successfully",
                    removeEpisodeResult 
                }
            })
        } catch (error) {
            next(error)
        }
    }

    async EditEpisodeByID(req, res, next) {
        try {
            let blackListData = ["_id"]
            const {id} =  req.params
            const episode = await this.getEpisodeByID(id)
            console.log("IDDDDD" + id);
            // const {title,text,type,filename,fileUploadPath} = req.body
            const {filename,fileUploadPath} = req.body
            console.log("FILENAME", filename);
            console.log("FILE UPLOAD PATH", fileUploadPath);
            if( filename && fileUploadPath ) {
                req.body.videoAddress = path.join(fileUploadPath, filename).replace(/\\/g, "/")
                console.log("VIDEO ADDRESS", req.body.videoAddress);
                const videoUrl = "http://localhost:5000/" + req.body.videoAddress
                console.log("VIDEO URL", videoUrl);
                const seconds = await getVideoDuration(videoUrl)
                console.log("SECONDS " + seconds);
                req.body.time = getTime(seconds)
                console.log("TIME " + req.body.time);
                blackListData.push("filename")
                blackListData.push("fileUploadPath")
            }
            else{
                blackListData.push("videoAddress")
                blackListData.push("time")
            }
            const data = req.body

            deleteInvalidPropertyInObject(data,blackListData)
            const newEpisode = {...episode,...data}
            const editEpisodeResult = await CourseModel.updateOne({
                "chapters.episodes._id": id},
                {$set: {
                    "chapters.$.episodes": newEpisode
                }})
            console.log("CREATE EPISODE RESULT", editEpisodeResult);
            if(!editEpisodeResult.modifiedCount) throw new createHttpError.InternalServerError("Episode not edited")
            const serializedResult = CircularJSON.stringify(editEpisodeResult);

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data:{
                    message: "Episode edited successfully",
                    editEpisodeResult: serializedResult
                }
            })
        } catch (error) {
            next(error)
        }
    }


    async getOneEpisode(episodeID){
        const course = await CourseModel.findOne({"chapters.episodes._id": episodeID}, {
            "chapters.$.episodes": 1
        })
        if(!course) throw new createHttpError.NotFound("Episode not found")
        const episode = await course?.chapters?.[0]?.episodes?.[0]
        if(!episode) throw new createHttpError.NotFound("Episode not found")
        return copyObject(episode)
    }
}

module.exports = {
    EpisodeController : new EpisodeController()
}