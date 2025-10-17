const {default: mongoose} = require('mongoose')


const Schema = new mongoose.Schema({
    title: {type: String, required: true},
    parent:{type: mongoose.Types.ObjectId, default:undefined, ref: 'category'},
},
    {
        id: false,
        versionKey: false,
        toJSON: {
            virtual: true
        }
    }
)


Schema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent"
})

function autoPopulate(next) {
    this.populate({
        path: 'children',
        select: {
            __v: 0,
            id: 0
        }
    })
    next()
}
Schema.pre('findOne', function (next) {
    this.populate({
        path: 'children'
    })
    next()

})
Schema.pre('find', autoPopulate)
module.exports = {
    CategoryModel: mongoose.model('Category', Schema),
}