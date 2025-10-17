const autoBind = require("auto-bind");
const res = require("express/lib/response");
const { TeamModel } = require("../../models/team");
const { UserModel } = require("../../models/user");

class TeamController{

    constructor(){
        autoBind(this)
    }     

    async createTeam(req,res,next){
        try {
            const {name,username,description} = req.body;
            const owner = req.user._id;
            const team = await TeamModel.create({
                name,
                description,
                username,
                owner
            })
            if(!team) throw {status:500, message: "There is a error for create a team"}
            return res.status(201).json({
                status:201,
                success: true,
                message: "created team successfully"
            })
        } catch (error) {
            next(error)
        }
    }


    async getListOfTeam(req,res,next){
        try {
            const teams = await TeamModel.find({})
            return res.status(200).json({
                status: 200,
                success: true,
                teams: teams
            })
        } catch (error) {
            next(error)
        }
    }


    async getTeamById(req,res,next){
        try {
            const teamID = req.params.id
            const team = await TeamModel.findById(teamID)
            if(!team) throw {status : 404, message: "Team is not found"}
            return res.status(200).json({
                status:200,
                success: true,
                team: team
            })
        } catch (error) {
            next(error)
        }
    }

    async getMyTeam(req,res,next){
        try {
            const userID = req.user._id;
            // const team = await TeamModel.findOne({
            //     $or: [{ owner : userID}, {users: userID}]
            // })
            const teams = await TeamModel.aggregate([
                {
                    $match: {
                        $or: [{owner: userID},{users: userID}]
                    }
                },
                {
                    $lookup: {
                        from : "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                    {
                        $project: {
                            "owner.roles" : 0,
                            "owner.password" : 0,
                            "owner.token" : 0,
                            "owner.teams" : 0,
                            "owner.skills" : 0,
                            "owner.invitation" :0
                        }
                    },
                    {
                        $unwind: "$owner"
                    }
                
            ]);
            return res.status(200).json({
                status: 200,
                success: true,
                teams: teams
            })         
        } catch (error) {
            next(error)
        }
    }

    async inviteUserToTeam(req,res,next){
        try {
            const userID = req.user._id
            const {username, teamID} = req.params;
            const team = await TeamModel.findOne({
                $or: [{owner: userID}, {users: userID}], _id: teamID
            })
            if(!team) throw {status: 404, message: "team not found to invite people"}
            const user = await UserModel.findOne({username});
            if(!user) throw {status: 400, message: "user not found to invite to the group"}
            const userInvited = await TeamModel.findOne({
                $or: [{owner: userID}, {users: user._id}], _id: teamID
            })
            if(userInvited) throw {status: 404, message: "the user already invited"}
            
            const request = {
                caller:  req.user.username,
                dateRequest: new Date,
                teamID,
                status: "pending"
            }

            const updatewUserResult = await UserModel.updateOne({username}, {
                $push: {
                    invitation: request
                }
            })

            if(updatewUserResult.modifiedCount == 0) throw {status: 500, message: "invitation not recorded"};
            return res.status(200).json({
                status: 200,
                success: "",
                message: "the request is successful"
            })
            

        } catch (error) {
            next(error)
        }
    }

    async removeTeamById(req,res,next){
        try {
            const teamID = req.params.id;
            const team = await TeamModel.findById(teamID);
            if(!team) throw {status: 404, message: "Team is nout found" }
            const result = await TeamModel.deleteOne({_id: teamID});
            if(result.deletedCount == 0) throw {status: 500, message: "Delete team failed"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "deleted team successfully"
            })

        } catch (error) {
            next(error)
        }
    }

    async updateTeam(req,res,next){
        const data = {...req.body}
        Object.keys(data).forEach(key => {
            if(!data[key]) delete data[key]
            if(["", " ", undefined,null, NaN].includes(data[key])) delete data[key]
        })
        const userID = req.user._id;
        const {teamID} = req.params;
        const team = await TeamModel.updateOne({_id: teamID}, {$set : data})
        if(!team) throw {status: 404, message: "team not found"}
        const teamEditResult = await TeamModel.updateOne({_id: teamID}, {$set: data});
        if(teamEditResult.modifiedCount == 0) throw {status: 500, message: "updated team details failed"}
        return res.status(200).json({
            status:200,
            success: true,
            message: "updated successfully"
        })
    }

    removeUserFromTeam(){} 

}


module.exports = {

    TeamController: new TeamController()
}