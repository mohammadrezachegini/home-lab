const { PermissionsModel } = require('../../../../models/permission')
const {StatusCodes: HttpStatus} = require("http-status-codes")
const Controller = require('../../controllers')
const { addPermissionSchema } = require('../../../validations/admin/RBAC.schema')
const  createHttpError  = require('http-errors')
const { copyObject, deleteInvalidPropertyInObject } = require('../../../../../utils/function')
class PermissionController extends Controller {

    async getAllPermissions(req,res,next) {
        try {
            const permissions = await PermissionsModel.find({})
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Permissions retrieved successfully',
                    permissions
                }
            })
        } catch (error) {
            next(error)
        }
    }

    async createPermissions(req,res,next) {
        try {
            await addPermissionSchema.validateAsync(req.body)
            const {title,description} = req.body
            console.log("description IS " + description);
            console.log("Title IS " + title);
            const permission = await PermissionsModel.findOne({title})
            console.log("ROLE IS " + permission);
            if(permission) throw new createHttpError.InternalServerError('Permission is Existing')
            const createdPermission = await PermissionsModel.create({
                title,
                description
            })
            if(!createdPermission) throw new createHttpError.InternalServerError('Permission not created')
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: {
                    message: 'Permission created successfully',
                    createdPermission
                }
            })
        } catch (error) {
            next(error)
        }
    }

    async removePermission(req,res,next) {
        try {
            const {id} = req.params
            await this.findPermissionById(id)
            const removePermissionResult = await PermissionsModel.deleteOne({_id: id})
            if(!removePermissionResult) throw new createHttpError.InternalServerError('Permission not deleted')
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Permission deleted successfully',
                    removePermissionResult
                }
            })
        } catch (error) {
            next(error)
        }
    }  



    async editPermissionById(req,res,next) {
        try {
            const {id} = req.params
            const data = copyObject(req.body)
            deleteInvalidPropertyInObject(data,[])
            const updatePermissionResult = await PermissionsModel.updateOne({_id: id}, {
                $set: data
            })
            if(!updatePermissionResult.modifiedCount) throw new createHttpError.InternalServerError('Permission not updated')
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Permission updated successfully',
                    updatePermissionResult
                }
            })

        } catch (error) {
            next(error)
        }
    }
    
    async findPermissionById(_id) {
        const permission = await PermissionsModel.findById({_id})
        if(!permission) throw new createHttpError.NotFound('Permission not found')
        return permission
    }
}




module.exports = {
    PermissionController : new PermissionController()
}