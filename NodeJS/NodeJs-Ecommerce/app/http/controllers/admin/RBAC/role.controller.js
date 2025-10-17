const Controller = require('../../controllers')
const {StatusCodes: HttpStatus} = require("http-status-codes")
const createHttpError = require('http-errors')
const { addRoleSchema } = require('../../../validations/admin/RBAC.schema')
const {RoleModel} = require("../../../../models/role")
const mongoose = require('mongoose')
const { copyObject, deleteInvalidPropertyInObject } = require('../../../../../utils/function')
class RoleController extends Controller {

    async getAllRoles(req,res,next) {
        try {
            // .populate([{path: 'permissions'}])
            const roles = await RoleModel.find({})
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Roles fetched successfully',
                    roles
                }
            })
            
        } catch (error) {
            
        }
    }

    async createRole(req,res,next) {
        try {
            await  addRoleSchema.validateAsync(req.body)
            const {title,permissions} = req.body
            console.log("PERMISSIONS IS " + permissions);
            console.log("Title IS " + title);
            const role = await RoleModel.findOne({title})
            console.log("ROLE IS " + role);
            if(role) throw new createHttpError.InternalServerError('Role is Existing')
            const createdRole = await RoleModel.create({
                title,
                permissions
            })
            if(!createdRole) throw new createHttpError.InternalServerError('Role not created')
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: {
                    message: 'Role created successfully',
                    createdRole
                }
            })
        } catch (error) {
            next(error)
        }
    }

    async removeRole(req,res,next) {
        try {
            const {field} = req.params
            const role = await this.findRoleWithTitleOrId(field)
            const removeRoleResult = await RoleModel.deleteOne({_id: role._id})
            if(!removeRoleResult) throw new createHttpError.InternalServerError('Role not removed')
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Role removed successfully',
                    removeRoleResult
                }
            })

        } catch (error) {
            next(error)
        }
    }

    async editRoleById(req,res,next) {
        try {
            const {id} = req.params
            const role = await this.findRoleWithTitleOrId(id)
            const data = copyObject(req.body)
            deleteInvalidPropertyInObject(data,[])
            const updateRoleResult = await RoleModel.updateOne({_id: role._id}, {
                $set: data
            })
            if(!updateRoleResult.modifiedCount) throw new createHttpError.InternalServerError('Role not updated')
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: {
                    message: 'Role updated successfully',
                    updateRoleResult
                }
            })

        } catch (error) {
            next(error)
        }
    }


    async findRoleWithTitleOrId(field) {
        let findQuery = mongoose.isValidObjectId(field)? { _id: field } : { title: field }
        const role = await RoleModel.findOne(findQuery)
        if(!role) throw new createHttpError.InternalServerError('Role not found')
        return role
    }
}

module.exports = {
    RoleController : new RoleController()
}