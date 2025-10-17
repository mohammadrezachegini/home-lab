const {default: mongoose} = require("mongoose")
const {CommentSchema} = require("./public.schema")
const ProductSchema = new mongoose.Schema({

    title : {type: String, required: true},
    short_text : {type: String, required: true},
    text : {type: String, required: true},
    images : {type: [String], required: true},
    tags : {type: [String], required: true},
    category : {type: mongoose.Types.ObjectId, required: true},
    comments : {type: [CommentSchema], default: []},
    like : {type: [mongoose.Types.ObjectId], default: []},
    dislike : {type:  [mongoose.Types.ObjectId], default: []},
    bookmark : {type:  [mongoose.Types.ObjectId], default: []},
    price : {type: Number, default: 0},
    discount : {type: Number, default: 0},
    count : {type: Number},
    type : {type: String, required: true},
    time : {type: String},
    format : {type: String},
    instructor : {type:  mongoose.Types.ObjectId, required: true},
    features : {type: Object, default: {
        length: "",
        height: "",
        width: "",
        weight:"",
        colors: [],
        models: [],
        madein: ""
    }}

},{
    toJSON: {virtual: true},
});

ProductSchema.index({title: "text", short_text: "text", text: "text"})

ProductSchema.virtual("imagesURL").get(function () {
    return this.images.map( image =>`http://localhost:50000/${image}`)
})

module.exports = {
    ProductModel: mongoose.model("product", ProductSchema)
}