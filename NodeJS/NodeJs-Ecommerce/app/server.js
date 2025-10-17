const express = require("express")
const mongoose = require("mongoose");
const path = require("path");
const { AllRoutes } = require("./routers/router");
const morgan = require("morgan")
const createError = require("http-errors")
const swaggerUI = require("swagger-ui-express")
const swaggerJsDoc = require("swagger-jsdoc")
const cors = require("cors")
module.exports = class Application {
    #app = express();
    #DB_URI;
    #PORT;

    constructor(PORT, DB_URI){
        this.#PORT = PORT;
        this.#DB_URI = DB_URI
        this.configApplication(),
        this.connectToMongoose(),
        this.createServer(),
        this.createRoutes(),
        this.errorHandling(),
        this.InitRedis()
    }

    configApplication(){
        this.#app.use(cors())
        this.#app.use(morgan("dev"))
        this.#app.use(express.json())
        this.#app.use(express.urlencoded({extended: true}))
        this.#app.use(express.static(path.join(__dirname, "..", "public")));
        this.#app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc({
            swaggerDefinition: {
                openapi: "3.0.0",
                info: {
                    title: "Reza Store",
                    version: "2.0.0",
                    description: "The biggest store around the world",
                    contact: {
                        name: "Reza Chegini",
                        url: "https://idontavesite.com",
                        email: "mr.goodarzvand.chegini@gmail.com"
                    }

                },
                servers: [
                    {
                        url: "http://localhost:5000"
                    }
                ],
                components: {
                    securitySchemes: {
                        BearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT"
                        }
                    }
                },
                security: [{
                    BearerAuth: []
                }]

            },
            apis:["./app/routers/**/*.js"]
        }),
        {
            explorer: true
        }
        ))
    }
    
    createServer(){
        const http = require("http")
        http.createServer(this.#app).listen(this.#PORT, () => {
            console.log(`runining server on > http://localhost:${this.#PORT}`);
        })
    }

    connectToMongoose(){
        mongoose.set("strictQuery", true)
        mongoose.connect(this.#DB_URI).then(()=>{
            console.log("Connect to DB is Successful");
        }).catch((e)=>{
            console.log("No connection " + e);
        });

        mongoose.connection.on("connected" , () => {
            console.log("mongoose connected to db");
        })
        mongoose.connection.on("disconnected", () => {
            console.log("mongoose connection is disconnected");
        })

        process.on("SIGINT", async() => {
            console.log("CLOSED");
            await mongoose.connection.close()
            process.exit(0)
        })
    }


    InitRedis(){
        require("../utils/init_redis")
    }

    createRoutes(){
        this.#app.use(AllRoutes)
        
    }

    errorHandling(){
        this.#app.use((req,res,next) => {
            next(createError.NotFound("Page not found"))
        })
        this.#app.use((error, req,res,next)=> {
            const serverError = createError.InternalServerError()
            const statusCode = error.status || serverError.status;
            const message = error.message || serverError.message
            return res.status(statusCode).json({
                errors: {
                    statusCode,
                    message
                }
            })
        })
    }
}