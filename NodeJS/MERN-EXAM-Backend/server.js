const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 5000;
const {AllRoutes} = require('./routers/router');
app.use(cors());
app.use(express.json());
app.use(AllRoutes);
// const uri = "mongodb+srv://reza:a19941994m@mongo.yt6yw4d.mongodb.net/?retryWrites=true&w=majority"
const uri = "mongodb+srv://reza:a19941994m@mongo.yt6yw4d.mongodb.net/300354368-rezachegini"

mongoose.connect(uri);
const connection = mongoose.connection;
connection.once("open", () => {
 console.log("MongoDB database connection established successfully");
});

app.listen(port, () => {
 console.log(`Server is running on port: ${port}`);
});