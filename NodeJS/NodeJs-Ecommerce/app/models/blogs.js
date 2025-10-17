const {default: mongoose} = require("mongoose")
const {CommentSchema} = require("./public.schema")


const BlogSchema = new mongoose.Schema({

    author: {type: mongoose.Types.ObjectId,ref: "user", required: true},
    title : {type: String, required:true},
    short_text : {type: String, required: true},
    text : {type: String, required: true},
    image : {type: String, required: true},
    tags : {type: [String], default: []},
    category : {type: mongoose.Types.ObjectId,ref: "Category", required: true},
    comments : {type: [CommentSchema], default: []},
    likes : {type:[mongoose.Types.ObjectId], ref: "user", default: []},
    dislikes : {type:[mongoose.Types.ObjectId], ref: "user", default: []},
    bookmarks : {type:[mongoose.Types.ObjectId],ref: "user",  default: []}

},
{
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtual: true
    }
});

BlogSchema.virtual("user", {
    ref: "user",
    localField: "_id",
    foreignField: "author"
})

BlogSchema.virtual("category_detail", {
    ref : "Category",
    localField : "_id",
    foreignField: "category"
})
BlogSchema.virtual("imageURL").get(function () {
    return `http://localhost:50000/${this.image}`
})
module.exports = {
    BlogModel: mongoose.model("blog", BlogSchema)
}
