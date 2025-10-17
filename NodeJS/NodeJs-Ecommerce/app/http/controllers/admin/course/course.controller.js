const Controller = require('../../controllers');
const {CourseModel} = require('../../../../models/course');
const {StatusCodes: HttpStatus} = require('http-status-codes')
const path = require('path');
const { createCourseSchema } = require('../../../validations/admin/course.schema');
const createHttpError = require('http-errors');
const { default: mongoose } = require('mongoose');
const { getTimeOfCourse } = require('../../../../../utils/function');
class CourseController extends Controller {
    async getAllCourses(req, res, next) {
        try {
            const {search} = req.query;
            let courses;
            if(search) courses = await CourseModel.find({$text: {$search: search}})
            .populate([
                {path: "category", select: {children: 0, parent: 0}},
                {path: "instructor", select: {first_name: 1, last_name: 1, email: 1}},
            ]).sort({_id : -1})
            else courses = await CourseModel.find({})
            .populate([
                {path: "category", select: {children: 0, parent: 0}},
                {path: "instructor", select: {first_name: 1, last_name: 1, email: 1}},
            ]).sort({_id : -1})
            return res.status(HttpStatus.OK).json({
                status:HttpStatus.OK,
                message: 'Courses fetched successfully',
                data:{
                    courses
                }
            })
            
        } catch (error) {
            next(error);
        }
    }

    async addCourse(req, res, next) {
        try {
            await createCourseSchema.validateAsync(req.body);
            const {fileUploadPath, filename} = req.body;
            const image =  path.join(fileUploadPath, filename).replace(/\\/g, "/");
            const {title,short_desc, full_desc, tags, category, price, discount,type} = req.body;
            const instructor = req.user._id;
            if(Number(price) > 0 && type === "Free") throw createHttpError.BadRequest("For free courses, price should be 0")
            const course = await CourseModel.create({
                title,
                short_desc, 
                full_desc, 
                tags, 
                category, 
                price, 
                discount, 
                type,
                image,
                status: "NotStarted",
                instructor


            })
            if(!course?._id) throw createHttpError.InternalServerError('Course not added')
            return res.status(HttpStatus.CREATED).json({
                statusCode:HttpStatus.CREATED,
                message: 'Course added successfully',
                data:{
                    course
                }
            })


        } catch (error) {
            next(error);
        }
    }

    async getCourseById(req, res, next) {
        try {
            const {id} = req.params;
            const course = await CourseModel.findById(id);
            if(!course) throw createHttpError.NotFound('Course not found')
            return res.status(HttpStatus.OK).json({
                statusCode:HttpStatus.OK,
                message: 'Course fetched successfully',
                data:{
                    course
                }
            })
        } catch (error) {
            
        }
    }


    async updateCourseById(req, res, next) {
        try {
            const {id} = req.params;
            if(!mongoose.isValidObjectId(id)) throw createHttpError.BadRequest("The course id is invalid");
            const course = await CourseModel.findById(id);
            if(!course) throw createHttpError.NotFound("Course not found");
            let blackListFields = ["time", "chapters", "episodes", "students", "bookmarks", "likes", "dislikes", "comments", "fileUploadPath", "filename"]
            deleteInvalidPropertyInObject(data, blackListFields)
            if(req.file){
                data.image = path.join(fileUploadPath, filename)
                deleteFileInPublic(course.image)
            }
            const updateCourseResult = await CourseModel.updateOne({_id: id}, {
                $set: data
            })
            if(!updateCourseResult.modifiedCount) throw new createHttpError.InternalServerError("Course not updated")

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: "Course updated successfully",
                    updateCourseResult
                }
            })
        } catch (error) {
            next(error);
        }
    }
    
    
}

module.exports = {
    CourseController : new CourseController()
}