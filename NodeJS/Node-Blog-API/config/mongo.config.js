const {default: mongoose} = require("mongoose")

const DB_URL = "mongodb://127.0.0.1:27017/blog";

mongoose.set("strictQuery", true)
mongoose.connect(DB_URL).then(()=>{
    console.log("connection is successfully");
}).catch((e)=>{
    console.log("no connection " + e);
});