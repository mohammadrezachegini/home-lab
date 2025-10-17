const express = require("express")
const{
    ErrorHandler,
    NotFoundError
} = require("./util/errorHandler")
const app = express()
const BlogController = require("./controller/blog.controller")
require("./config/mongo.config")

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.get("/", (req,res,next) => {

})

app.post("/create", BlogController.create)
app.post("/new", BlogController.newBlog)
app.get("/insertMany", BlogController.newBlogMany)
app.get("/blogs", BlogController.getBlog)
app.get("/blogs/:id", BlogController.getBlogById)
app.delete("/blogs/:id", BlogController.deleteBlogById)
app.delete("/blogs/", BlogController.deleteBlog)
app.put("/blogs/:id", BlogController.updateBlogById)
app.patch("/blogs/:id", BlogController.updateBlogByIdNew)


app.use(NotFoundError)
app.use(ErrorHandler)

app.listen(3000, () => {
    console.log("Server is running")
})