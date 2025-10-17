const { createBlogSchema } = require("../../../validations/admin/blog.schema")
const Controller = require("../../controllers")
const path = require("path")
const { BlogModel } = require("../../../../models/blogs")
const { deleteFileInPublic } = require("../../../../../utils/function")
const createError = require("http-errors")
const {StatusCodes:HttpStatus} = require("http-status-codes")
class BlogController extends Controller {
    async createBlog(req,res,next){
        try {

            const blogDataBody = await createBlogSchema.validateAsync(req.body)
            // return res.json(req.body)
            req.body.image = path.join(blogDataBody.fileUploadPath, blogDataBody.filename)
            req.body.image = req.body.image.replace(/\\/g, "/")
            const author = req.user._id
            const {title,text,short_text,tags,category} = blogDataBody
            const image = req.body.image
            const blog = await BlogModel.create({author,title,text,short_text,tags,category,image})
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                message: "success",
                data: {
                    blog
                }
            })
            
            
        } catch (error) {
            deleteFileInPublic(req.body.image)
            next(error)
        }
    }
    async getBlogById(req,res,next){
        try {

            const {id} = req.params
            const blog = await this.findBlog(id)
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "success",
                data: {
                    blog
                }
            })
            
        } catch (error) {
            next(error)
        }
    }
    async getAllBlogs(req,res,next){
        try {

            // const blogs = await BlogModel.find({})
            const blogs = await BlogModel.aggregate([
                {
                    $match :{}
                },
                {
                    $lookup : {
                        from: "users",
                        localField: "author",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $unwind : "$author"
                },
                {
                    $lookup : {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind : "$category"
                },
                {
                    $project: {
                        "author.__v": 0,
                        "category.__v": 0,
                        "author.otp": 0,
                        "author.roles": 0,
                        "author.discount": 0,
                        "author.bills": 0,
                    }
                }
            ])
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "success",
                data: {
                    blogs
                }
            })
        } catch (error) {
            next(error)
        }
    }
    async getCommentsOfBlog(req,res,next){
        try {
            
        } catch (error) {
            next(error)
        }
    }
    async deleteBlogById(req,res,next){
        try {

            const {id} = req.params
            await this.findBlog(id)
            const result = await BlogModel.deleteOne({_id: id})
            if(result.deletedCount == 0){
                throw createError.InternalServerError("Blog not found")
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "success",
                data: {
                    result
                }
            })

            
        } catch (error) {
            next(error)
        }
    }
    async updateBlogById(req,res,next){
        try {
            const {id} = req.params
            await this.findBlog(id)
            if(req?.body?.fileUploadPath, req?.body?.filename){
                req.body.image = path.join(req.body.fileUploadPath, req.body.filename)
                req.body.image = req.body.image.replace(/\\/g, "/")             
    
            }
            let nullishData = ["", " ", "0", 0, null, undefined]
            let blackListData = ["bookmarks","dislikes", "likes", "comments","author"]
            const data = req.body;
            Object.keys(data).forEach(key => {
                if(blackListData.includes(key)) delete data[key]
                if(typeof data[key] == "string") data[key] = data[key].trim()
                if(Array.isArray(data[key]) && data[key].length > 0) data[key] = data[key].map(item => item.trim())
                if(nullishData.includes(data[key])) delete data[key]
                
            })
           
            const updateResult = await BlogModel.updateOne({_id:id}, {$set: data})
            if(updateResult.modifiedCount == 0) throw createError.InternalServerError("update failed")
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                message: "success",
                data: {
                    updateResult
                }
            })
            
            
        } catch (error) {
            deleteFileInPublic(req?.body?.image)
            next(error)
        }
    }


    async findBlog(id) {
        const blog = await BlogModel.findById(id).populate([{path : "category", select : ['title']}, {path: "author", select : ['mobile', 'first_name', 'last_name', 'username']}]);
        if(!blog) throw createError.NotFound("Blog not found");
        delete blog.category.children
        return blog
    }

}

module.exports = {
    AdminBlogController: new BlogController()
}