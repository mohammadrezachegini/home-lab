const { UserModel } = require("../../models/user");
const { createLink } = require("../../modules/function");

class UserController{



    getProfile(req,res,next){
        try {
            const user = req.user
            user.profile_image = createLink(user.profile_image,req)
            return res.status(200).json({
                status: 200,
                success: true,
                user
            })
        } catch (error) {
            next(error);
        }
    }

    async editProfile(req,res,next){

        try {
            let data = {...req.body};
            const userID = req.user._id
            let fields = ["first_name","lst_name", "skills"]
            let badValues = ["", " ", null, undefined, 0, -1, NaN, [], {}]
            Object.entries(data).forEach(([key, value]) => {
                if(!fields.includes(key)) delete data[key]
                if(badValues.includes(value)) delete data[key]
            })
            console.log(data);
            const result = await UserModel.updateOne({_id: userID}, {$set: data})
            if (result.modifiedCount > 0){
                res.status(200).json({
                    status:200,
                    success: true,
                    message: "updated profile successfully"
                })
            }
            throw {status: 400, message: "FAILED update profile"}
        } catch (error) {
            next(error)
        }

    }

    async uploadProfileImage(req, res, next){
        
        try {
            const userID = req.user._id
            // if(Object.keys(req.file).length == 0) throw {status: 400, message: "Please upload a picture"}
            const filePath = req.file?.path.replace("\\\\", "/").substring(7);
            const result = await UserModel.updateOne({_id: userID}, {$set: {profile_image: filePath}})
            if(result.modifiedCount == 0) throw {status:400, message: "Failed Update Profile"}
            if(result.modifiedCount > 0 ) return res.status(200).json(
                {
                    status:200, 
                    success: true, 
                    message: "updated profile successfully"})
        } catch (error) {
            next(error)
        }
    }

    async getAllRequests(req,res,next){
        try {
            const userID = req.user._id;
            // const {invitation} = await UserModel.findOne({_id: userID}, {invitation: 1})
            const invitation = await UserModel.aggregate([
                {
                    $match: {
                        _id: userID
                    }
                },
                // {
                //     $project: {invitation: 1}
                // },
                {
                    $lookup: {
                        from: "users",
                        localField: "invitation.caller",
                        foreignField: "username",
                        as: "invitation.caller"
                    }
                }
                ])
            return res.json({
                requests: invitation
            })
        } catch (error) {
            next(error)
        }
    }


    async getRequestByStatus(req,res,next){
        try { 

            const {status} = req.params;
            const userID = req.user._id
            const request = await UserModel.aggregate([
                {
                $match: {_id: userID}
                },
                {
                    $project: {
                        invitation: 1,
                        _id: 0,
                        invitation  : {
                            $filter: {
                                input: "$invitation",
                                as: "request",
                                cond: {
                                    $eq: ["$$request.status", status]
                                }
                            }
                        }
                    }
                }
        ])
         return res.status(200).json({
            status:200,
            success: true,
            request: request?.[0]?.invitation ||  []
         })
        } catch (error) {
             next(error)
        } 
     }

    // async getPendingRequests(req,res,next){
    //    try {
        
    //    } catch (error) {
    //         next(error)
    //    } 
    // }

    // async getAcceptedRequests(req,res,next){
    //     try {
         
    //     } catch (error) {
    //          next(error)
    //     } 
    //  }

    //  async getRejectedRequests(req,res,next){
    //     try {
         
    //     } catch (error) {
    //          next(error)
    //     } 
    //  }

    addSkills(){}

    editSkills(){}

    async changeRequestByStatus(req,res,next){
        try {
            const {id, status} = req.params;
            const requests = await UserModel.findOne({"invitations._id": id})
            if(!request) throw {status: 404, message:"no request found with these details"}
            const findRequest = requests.invitation.find(item => item.id == id)
            if(findRequest.status !== "pending") throw {status: 400, message: "this request already responded"}
            if(!["accepted", "rejected"].includes(status)) throw {status: 400, message:"the information that you sent is wrong"}
            const updateResult = await UserModel.updateOne({"invitation._id": id}, {
                $set: {"invitation.$.status" : status}
            }) 
            if(updateResult.modifiedCount == 0) throw {status: 500, message: "the change request didnt accept"}
            return res.status(200).json({
                status:200,
                success: true,
                message: "change request accepted"
            })
        } catch (error) {

            next(error)
            
        }
    }

    rejectInvitation(){}
}

module.exports = {
    UserController : new UserController()
}