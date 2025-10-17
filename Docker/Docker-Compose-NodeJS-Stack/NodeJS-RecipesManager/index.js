const Application = require("./app/server");

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URL || "mongodb://localhost:27017/CSIS4495";

new Application(port, mongoUri);