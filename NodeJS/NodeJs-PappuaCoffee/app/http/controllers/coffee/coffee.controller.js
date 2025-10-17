const { CoffeeModel} = require("../../../models/coffee")
const {isValidObjectId} = require("mongoose");
// const autoBind = require("auto-bind");
const {createLink} = require("../../../../utils/function");
const  fileUpload = require("express-fileupload");

class CoffeeControllers{

    constructor(){
        // autoBind(this)
    }

    async createCoffee(req,res,next){
        try {
            console.log("Body ISSSSSSS" + req.body)
            const {product_name, description, price } = req.body;
            const image = req.files.image
            console.log("What is images      "+ image);
            console.log("Image innnnnnn" + req.files.image);
            // const owner = req.coffee._id
            
            const result = await CoffeeModel.create({product_name, description, price, image})
            console.log("result IS ISI" + result);
            if(!result) throw {
                status: 400,
                message: "There is a problem to add a coffee"
            }
            return res.status(201).json({
                status: 201,
                success: true,
                message: "Added Coffee successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    async getAllCoffee(req,res,next){
        try {
            console.log(req);
            // const coffeeID = req.coffee._id
            const coffees = await CoffeeModel.find({})
            for (const coffee of coffees) {
                coffee.image = createLink(coffee.image,req)
            }
            return res.status(200).json({
                status: 200,
                success: true,
                coffees
            })
        } catch (error) {
            next(error)
        }
    }

    async findCoffee(CoffeeID, product_name){
        const coffee = await CoffeeModel.findOne({id: CoffeeID})
        if(!coffee) throw {status :  404, message: "Coffee Not Found"}
        return coffee

    }

    async getCoffeeById(req,res,next){
        try {
            // const product_name = req.user.product_name;
            const coffeeID = req.params.id;
            const coffee  = await CoffeeModel.findOne({_id: coffeeID})
            coffee.image = createLink(coffee.image,req)
            return res.status(200).json({
                status: 200,
                success: true,
                coffee
            })
        } catch (error) {
            next(error)
        }
    }
    async removeCoffee(req,res,next){
        try {
            // const product_name = req.user._id;
            const coffeeID = req.params.id;
            const coffee  = await CoffeeModel.findOne({id: coffeeID})
            const deleteCoffeeResult = await CoffeeModel.deleteOne({_id : coffeeID})
            if(deleteCoffeeResult.deletedCount == 0) throw {status: 400, message: "Coffee did not remove"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "Coffee deleted successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    async updateCoffee(req,res,next){
        try {
            // const product_name =  req.co.product_name
            const coffeeID = req.params.id
            const coffee  = await CoffeeModel.findOne({id: coffeeID})
            const data = {...req.body}
            Object.entries(data).forEach(([key, value]) => {
                if(!["product_name", "description", "price", "image"].includes(key)) delete data[key]
                if(["", " ", 0, null,undefined, NaN].includes(value)) delete data[key]
                // if(key == "tags" && (data['tags'].constructor === Array)){
                //     data["tags"] = data["tags"].filter(val => {
                //         if(!["", " ", 0, null, undefined, NaN].includes(val)) return val
                //     })
                //     if(data['tags'].length == 0) delete data['tags'] 
                // }
            })
            const updateResult = await CoffeeModel.updateOne({_id:  coffeeID}, {$set : data})
            if(updateResult.modifiedCount == 0) throw {status: 400, message: "Updated profile failed"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "updated coffee sucessfully"           
            })
        } catch (error) {
            next(error)
        }
    }

    async updateCoffeeImage(req,res,next){
        try {
            const image = req.files.image;
            console.log("CONST LOG IMAGE" + image);
            // const product_name = req.user.product_name;
            const coffeeID = req.params.id
            console.log("coffeeID" + coffeeID);
            const coffee  = await CoffeeModel.findOne({id: coffeeID})
            console.log("FIND PROJEC?T" + coffee);
            await CoffeeModel.findOne({id: coffeeID})
            const updateResult =  await CoffeeModel.updateOne({_id: coffeeID}, {$set: {image}})
            console.log("updateResult     " + updateResult);
            if(updateResult.modifiedCount == 0) throw {status: 400, message: "Updated profile failed"}
            return res.status(200).json({
                status: 200,
                success: true,
                message: "updated coffee successfully"           
            })
        } catch (error) {
            next(error)
        }
    }

    


}


module.exports = {
    CoffeeController: new CoffeeControllers()
}