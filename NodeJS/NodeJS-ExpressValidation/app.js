const express = require("express");
const { validate } = require("express-validation");
const {ErrorHandler, NotFoundError} = require("./util/errorHandler");
const { loginValidation, registerValidation } = require("./validators/auth.validator");
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.post("/login", validate(loginValidation),(req,res) => {
    res.send(req.body)
})

app.post("/register", validate(registerValidation),(req,res) => {
    res.send(req.body)
})

app.use(NotFoundError)
app.use(ErrorHandler);


app.listen(3000,()=>{
    console.log("Server is runing on port 3000");
})