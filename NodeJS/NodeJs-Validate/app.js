const express = require("express");
const {ErrorHandler, NotFoundError} = require("./util/errorHandler");
const {registerSchema} = require("./validators/auth.validator")
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.post("/login",async(req,res,next) => {
    try {

        res.send(req.body)
    } catch (error) {
        next(error)
    }
})

app.post("/register",(req,res,next) => {
    try 
    {
        const [error] = registerSchema.validate(req.body)
        console.log(error);
        if(error) throw error
        res.send(req.body);
    } catch (err) {
        next(err);
    }
})

app.use(NotFoundError)
app.use(ErrorHandler);


app.listen(3000,()=>{
    console.log("Server is runing on port 3000");
})