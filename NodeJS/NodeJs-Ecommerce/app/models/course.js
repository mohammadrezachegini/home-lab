const {default: mongoose} = require("mongoose")
const { getTimeOfCourse } = require("../../utils/function")
const {CommentSchema} = require("./public.schema")


const EpisodeSchema = new mongoose.Schema({
    title: {type: String, required: true},
    text: {type: String, required: true},
    type: {type: String, default: "unlock"},
    time: {type: String, required: true},
    videoAddress: {type: String, required: true},
},{
    toJSON: {virtual: true},
})

EpisodeSchema.virtual("videoURL").get(function () {
    return `http://localhost:50000/${this.videoAddress}`
})

const ChapterSchema = new mongoose.Schema({
    title: {type: String, required: true},
    text: {type: String, required: true},
    episodes: {type: [EpisodeSchema], default: []},
})

const CourseSchema = new mongoose.Schema({

    title : {type: String, required: true},
    short_desc : {type: String, required: true},
    full_desc : {type: String, required: true},
    image : {type: String, required: true},
    tags : {type: [String], required: true},
    category : {type: mongoose.Types.ObjectId, required: true},
    comments : {type: [CommentSchema], default: []},
    like : {type: [mongoose.Types.ObjectId], default: []},
    dislike : {type:  [mongoose.Types.ObjectId], default: []},
    bookmark : {type:  [mongoose.Types.ObjectId], default: []},
    price : {type: Number, default: 0},
    discount : {type: Number, default: 0},
    type : {type: String, required: true, default: "free"},
    status : {type: String, default: "NotStarted"},
    instructor : {type:  mongoose.Types.ObjectId,ref: "user",  required: true},
    chapters: {type:  [ChapterSchema],  default: []},
    students: {type:  [mongoose.Types.ObjectId],  default: [], ref: "user"},


},{
    toJSON: {virtual: true},
});
CourseSchema.index({title: "text", short_desc: "text", full_desc: "text"})

CourseSchema.virtual("imageURL").get(function () {
    return `http://localhost:50000/${this.image}`
})

CourseSchema.virtual("totalTime").get(function () {
    return getTimeOfCourse(this.chapters || [])
})


module.exports = {
    CourseModel: mongoose.model("course", CourseSchema)
}