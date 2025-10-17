const {CategoryModel} = require('../../../../models/categories');
const createError = require("http-errors");
const Controller = require('../../controllers');
const { addCategorySchema, updateCategorySchema } = require('../../../validations/admin/category.schema');
const  {mongoose}  = require('mongoose');
const {StatusCodes:HttpStatus} = require("http-status-codes")

class CategoryController extends Controller {
 
    async addCategory(req, res,next) {
        try {
            await addCategorySchema.validateAsync(req.body);
            const {title, parent} = req.body;
            const Category = await CategoryModel.create({title, parent});
            if(!Category) throw createError.InternalServerError("Internal Server Error")
            return res.status(HttpStatus.CREATED).json({
                data:{
                    statusCode:HttpStatus.CREATED,
                    message:"Category Created Successfully",
                    Category
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async checkExistCategory(id){
        const category = await CategoryModel.findById(id)
        if(!category) throw createError.NotFound("Category Not Found")
        return category
    }

    async removeCategory(req, res,next) {
        try {
            
        } catch (error) {
            next(error);
        }
    }
    async updateCategory(req, res,next) {
        try {
            
        } catch (error) {
            next(error);
        }
    }
    async getAllCategory(req, res,next) {
        try {

            // const category = await CategoryModel.aggregate([
            //     {
            //         // $lookup: {
            //         //     from: "categories",
            //         //     localField: "_id",
            //         //     foreignField: "parent",
            //         //     as: "children"
            //         // }
            //         $graphLookup: {
            //             from: "categories",
            //             startWith: "$id",
            //             connectFromField: "_id",
            //             connectToField: "parent",
            //             maxDepth:5,
            //             depthField: "depth",
            //             as: "children"
            //         }
            //     },
            //     {
            //         $project: {
            //             __v: 0,
            //             "children.__v": 0,
            //             "children.parent": 0,
            //         }
            //     },
            //     {
            //         $match : {
            //             parent: undefined
            //         }
            //     }
            // ])
            const category = await CategoryModel.find({parent: undefined})
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"All Categories",
                    category
                }
            })
            
        } catch (error) {
            next(error);
        }
    }
    async getCategoryById(req, res,next) {
        try {
            const {id: _id} = req.params;
            const category = await CategoryModel.aggregate([


                {
                    $match : {_id: new mongoose.Types.ObjectId(_id)}
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "parent",
                        as: "children"
                    }
                    
                },
                {
                    $project: {
                        __v: 0,
                        "children.__v": 0,
                        "children.parent": 0,
                    }
                },
                
            ])
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"Category By Id",
                    category
                }
            })
            
        } catch (error) {
            next(error);
        }
    }
    async getAllCategoriesByParent(req, res,next) {
        try {
            const parent = await CategoryModel.find({parent: undefined},{__v:0})
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"All Categories",
                    parent
                }
            })
        } catch (error) {
            next(error);
        }
    }
    async getAllChildCategory(req, res,next) {
        try {
            const {parent} = req.params;
            const children = await CategoryModel.find({parent},{__v:0, parent:0})
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"All Child Categories",
                    children
                }
            })
        } catch (error) {
            next(error);
        }
    }

    async removeCategory(req, res,next) {
        try {
            const {id} = req.params;
            const category = await this.checkExistCategory(id)
            const deleteResult = await CategoryModel.deleteMany({$or:
            
            [
                {_id: category._id},
                {parent: category._id}
            ]
            });
            if(deleteResult.deletedCount == 0) throw createError.InternalServerError("Unsuccessful Delete category")
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"Category Deleted Successfully"
                }
            })
        } catch (error) {
            console.log(error);
        }
    }

    async getAllCategoriesWithoutPopulate(req, res,next) {
        try {

            const categories = await CategoryModel.aggregate([
                {
                    $match:{}
                }
            ]);
            return res.status(HttpStatus.OK).json({
                data:{
                    statusCode:HttpStatus.OK,
                    message:"All Categories without populate",
                    categories
                }
            })
            
        } catch (error) {
            next(error);
        }

        
    }
    async editCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { title } = req.body;
            const category = await this.checkExistCategory(id);
            await updateCategorySchema.validateAsync(req.body);
            const updateResult = await CategoryModel.updateOne({ _id: id }, { $set: { title } });
            if (updateResult.modifiedCount === 0) {
                throw createError.BadRequest("Failed to update category. Category may not exist.");
            }
            return res.status(HttpStatus.CREATED).json({
                data: {
                    statusCode: HttpStatus.CREATED,
                    message: "Category updated successfully",
                },
            });
        } catch (error) {
            next(error);
        }
    }
}


module.exports = {
    CategoryController : new CategoryController()
}