const express = require("express")
const app = express()
const {ErrorHandler,NotFoundError} = require("./util/errorHandler")
const {uploadFile} = require("./middleware/multer")


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))

// app.post("/upload", uploadFile.single("image") ,(req,res,next) => {
// app.post("/upload", uploadFile.array("image",3) ,(req,res,next) => {
// app.post("/upload", uploadFile.fields([ {name: "image", maxCount: 2}, {name: "file", maxCount: 1}]) ,(req,res,next) => {
// app.post("/upload", uploadFile.any([ {name: "image", maxCount: 2}, {name: "file", maxCount: 1}]) ,(req,res,next) => {
app.post("/upload", uploadFile.none() ,(req,res,next) => {
    console.log(req.body);
    // res.send(req.file)
    res.send(req.files)
})

app.use(NotFoundError)
app.use(ErrorHandler)

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})