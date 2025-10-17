const {ProjectModel} = require("../../models/project")
const autoBind = require("auto-bind");
const { createLink } = require("../../modules/function");
class ProjectController{

    constructor(){
        autoBind(this)
    }

    async createProject(req,res,next){
        try {
            console.log("Body ISSSSSSS" + req.body)
            const {title, text, tags } = req.body;
            const image = req.files.image
            console.log("Image innnnnnn" + req.files.image);
            const owner = req.user._id
            const result = await ProjectModel.create({title, text, owner, image, tags})
            if(!result) throw {
                status: 400,
                message: "There is a problem to add a project"
            }
            return res.status(201).json({
                status: 201,
                success: true,
                message: "Added Project successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    async getAllProjects(req,res,next){
        try {
            const owner = req.user._id
            const projects = await ProjectModel.find({owner})
            for (const project of projects) {
                project.image = createLink(project.image,req)
            }
            return res.status(200).json({
                status: 200,
                success: true,
                projects
            })
        } catch (error) {
            next(error)
        }
    }

    async findProject(ProjectId, owner){
        const project = await ProjectModel.findOne({owner, _id: ProjectId})
        if(!project) throw {status :  404, message: "Project Not Found"}
        return project

    }

    async getProjectById(req,res,next){
        try {
            const owner = req.user._id;
            const projectID = req.params.id;
            const project  = await this.findProject(projectID, owner) 
            project.image = createLink(project.image,req)
            return res.status(200).json({
                status: 200,
                success: true,
                project
            })
        } catch (error) {
            next(error)
        }
    }
    async removeProject(req,res,next){
        try {
            const owner = req.user._id;
            const projectID = req.params.id;
            const project  = await this.findProject(projectID, owner)
            const deleteProjectResult = await ProjectModel.deleteOne({_id : projectID})
            if(deleteProjectResult.deletedCount == 0) throw {status: 400, message: "Project did not remove"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "Project deleted successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    async updateProject(req,res,next){
        try {
            const owner =  req.user._id
            const projectID = req.params.id
            const project = await this.findProject(projectID, owner)
            const data = {...req.body}
            Object.entries(data).forEach(([key, value]) => {
                if(!["title", "text", "tags"].includes(key)) delete data[key]
                if(["", " ", 0, null,undefined, NaN].includes(value)) delete data[key]
                if(key == "tags" && (data['tags'].constructor === Array)){
                    data["tags"] = data["tags"].filter(val => {
                        if(!["", " ", 0, null, undefined, NaN].includes(val)) return val
                    })
                    if(data['tags'].length == 0) delete data['tags'] 
                }
            })
            const updateResult = await ProjectModel.updateOne({_id:  projectID}, {$set : data})
            if(updateResult.modifiedCount == 0) throw {status: 400, message: "Updated profile failed"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "updated project sucessfully"           
            })
        } catch (error) {
            next(error)
        }
    }

    async updateProjectImage(req,res,next){
        try {
            const image = req.files.image;
            console.log("CONST LOG IMAGE" + image);
            const owner = req.user._id;
            const projectID = req.params.id
            console.log("projectIDprojectIDprojectID" + projectID);
            const a = await this.findProject(projectID, owner)
            console.log("FIND PROJEC?T" + a);
            await this.findProject(projectID, owner)
            const updateResult =  await ProjectModel.updateOne({_id: projectID}, {$set: {image}})
            console.log("updateResult     " + updateResult);
            if(updateResult.modifiedCount == 0) throw {status: 400, message: "Updated profile failed"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "updated project sucessfully"           
            })
        } catch (error) {
            next(error)
        }
    }

    getAllProjectOfTeam(){}

    getProjectofUser(){}

    


}


module.exports = {
    ProjectController: new ProjectController()
}