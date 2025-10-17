const {BlogModel} = require("../model/blog.model")
const {isValidObjectId} = require("mongoose");
const omitEmpty = require("omit-empty");
async function create (req,res,next) {
    try {
        const {title, text} = req.body;
        const result = await BlogModel.create({
            text,
            title
        })

        res.send(result)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}


async function newBlog (req,res,next) {
    try {
        const {title, text} = req.body;
        const newObject = new BlogModel({
            text,
            title
        })
        await newObject.save()
        res.send(newObject)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

async function newBlogMany (req,res,next) {
    try {
        const newObjects = await BlogModel.insertMany([
            {
                title: "smthsmth1",
                text: "smthsmth1"
            },
            {
                title: "smthsmth2",
                text:  "smthsmth2"
            },
            {
                title: "smthsmth3",
                text: "smthsmth3"
            }
        ])
        res.send(newObjects)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

async function getBlog(req,res,next) {
    const blogs = await BlogModel.find();
    res.send({
        statusCode: 200,
        documentCount: blogs.length,
        blogs
    })
}

async function getBlogById(req,res,next) {
    try {
        const {id} = req.params
        if(!isValidObjectId(id)) throw ({status: 400, message: "Your id is not valid"})
        const blog = await BlogModel.findOne({_id: id});
        res.send(blog)
    }
    catch (err){
        next(err)
    }
}

async function deleteBlogById(req,res,next) {
    try {
        const {id} = req.params
        if(!isValidObjectId(id)) throw ({status: 400, message: "Your id is not valid"})
        const result = await BlogModel.deleteOne({_id: id});
        res.send(result)
    }
    catch (err){
        next(err)
    }
}

async function deleteBlog(req,res,next) {
    try {
        const result = await BlogModel.deleteMany();
        res.send(result)
    }
    catch (err){
        next(err)
    }
}


async function updateBlogById (req,res,next) {
    try {
        const  {id} = req.params;
        const newBodyObj = omitEmpty(req.body);
        const blog = await BlogModel.findOne({_id:id});
        if(!blog){
            throw({status:404, message: "not found"});
        }
        Object.assign(blog, newBodyObj);
        await blog.save()
        res.send(blog)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}

async function updateBlogByIdNew (req,res,next) {
    try {
        const  {id} = req.params;
        const newBodyObj = omitEmpty(req.body);
        const blog = await BlogModel.findOne({_id:id});
        if(!blog){
            throw({status:404, message: "not found"});
        }
        const result = await BlogModel.updateOne({_id:id}, {
            $set: newBodyObj
        })
        // await blog.save()
        res.send(result)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}



module.exports ={
    create,
    newBlog,
    newBlogMany,
    getBlog,
    getBlogById,
    deleteBlogById,
    deleteBlog,
    updateBlogById,
    updateBlogByIdNew
}