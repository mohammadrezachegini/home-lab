// const products  = require('./../data/products.json')
const MongoConnection = require("../utils/mongo-connection")
// const db = new MongoConnection()
const {ObjectId} = require("mongodb");
const ProductCollection = "product"

async function find() {
    const db = await new MongoConnection().Get();
    return new Promise(async (resolve, reject) => {
        const products = await db.collection("product").find({},{
            sort: {
                _id: -1
            }
        }).toArray();
        resolve(products)
    })

}

async function findById(id) {
    const db = await new MongoConnection().Get();
    return new Promise(async (resolve, reject) => {
        const product = await db.collection("product").findOne({_id: new ObjectId((id))})
        resolve(product)
    })

}

async function create(product) {
    const db = await new MongoConnection().Get();
    return new Promise(async (resolve, reject) => {
        const result = await db.collection("product").insertOne(product)
        resolve(result);
    })

}

async function update(id,payload) {
    const db = await new MongoConnection().Get();
    return new Promise(async (resolve, reject) => {
        const result = await db.collection("product").updateOne({_id: new ObjectId(id)},{
            $set: {...payload}
        })
        resolve(result);

    })

}



async function remove(id) {
    const db = await new MongoConnection().Get();
    return new Promise(async (resolve, reject) => {
        const result = await db.collection("product").deleteOne({_id: new ObjectId(id)})
        resolve(result);

    })

}




const ProductModel = {
    find,
    findById,
    create,
    update,
    remove
}

module.exports = ProductModel