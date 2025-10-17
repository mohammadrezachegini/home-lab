const ProductModel = require("../models/products.model");

async function get(req,res) {
    try{
        const products = await ProductModel.find();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(products))
        res.end()
    }
    catch(error){

    }
}



async function getById(req,res) {
    try{
        // const [,,id] = req.url.split("/")
        const id = req.url.split("/")[3]
        const product = await ProductModel.findById(id);
        console.log(product)
        if (!product){
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({messages: "Not Found any product"}))
            res.end()
        }
        else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(product))
            res.end()
        }
    }
    catch(error){

    }
}


async function create(req,res) {
    try{
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        })
        req.on('data',async() => {
            const product = {...JSON.parse(body),createdAt: Date.now()}
            const result = await ProductModel.create(product)
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(result))
            res.end()

        })
        // await ProductModel.create({
        //     "id": Date.now(),
        //     "title": "iPhone 14",
        //     "description": "An apple mobile which is nothing like apple",
        //     "price": 549,
        //     "discountPercentage": 16.49,
        //     "rating": 4.82,
        //     "stock": 54,
        //     "brand": "Apple",
        //     "category": "smartphones",
        //     "thumbnail": "https://i.dummyjson.com/data/products/28/thumbnail.jpg",
        //     "images": [
        //         "https://i.dummyjson.com/data/products/28/1.jpg",
        //         "https://i.dummyjson.com/data/products/28/2.jpg",
        //         "https://i.dummyjson.com/data/products/28/3.png",
        //         "https://i.dummyjson.com/data/products/28/4.jpg",
        //         "https://i.dummyjson.com/data/products/28/thumbnail.jpg"
        //     ]
        //
        // });
        // res.writeHead(201, {'Content-Type': 'application/json'});
        // res.write(JSON.stringify({message: "product save successfully"}))
        // res.end()
    }
    catch(error){

    }
}


async function update(req,res) {
    try{
        let body = '';
        const id = req.url.split("/")[3]

        req.on('data', (chunk) => {
            body += chunk.toString();
        })
        req.on('data',async() => {
            const parsedBody = {...JSON.parse(body)}
            const product = await ProductModel.findById(id);
            if(!product){
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({messages: "Not Found any product"}))
                res.end()
            } else {
                const result = await ProductModel.update(id, parsedBody)
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(result))
                res.end()
            }


        })

    }
    catch(error){

    }
}


async function remove(req,res) {
    try{
        // const [,,id] = req.url.split("/")
        const id = req.url.split("/")[3]
        const product = await ProductModel.findById(id);
        console.log(product)
        if (!product){
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({messages: "Not Found any product"}))
            res.end()
        }
        else{
            const result = await ProductModel.remove(id);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(result))
            res.end()
        }
    }
    catch(error){

    }
}


const ProductsController = {
    get,
    getById,
    create,
    update,
    remove
}

module.exports = ProductsController