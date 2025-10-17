const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')

const app = express()
app.use(express.json())

const authRoute = require('./routes/Auth')
const userRoute = require('./routes/Users')
const postRoute = require('./routes/Posts')
const catRoute = require('./routes/Categories')

mongoose.connect('mongodb://localhost:27017/blog',)
    .then(res =>console.log("Connected to Mongoose"))
    .catch(err => console.log(err))

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null,"images")
    }, filename:(req, file, cb) =>{
        cb(null,req.body.name)
    }
})

const upload = multer({storage:storage});
app.post("/api/upload", upload.single("file"),(req, res) =>{
    res.status(200).json("file has been uploaded")
})

app.use("/api/auth",authRoute)
app.use("/api/users",userRoute)
app.use("/api/posts",postRoute)
app.use("/api/categories",catRoute)

app.listen("3000", () => {
    console.log("Backend is running....")
})