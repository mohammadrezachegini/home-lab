const Controller = require("../../../controllers/controllers");
const {createProductSchema} = require("../../../validations/admin/product.schema");
const { deleteFileInPublic, ListOfImagesFromRequest, setFeatures, copyObject, deleteInvalidPropertyInObject } = require("../../../../../utils/function");
const { ProductModel } = require("../../../../models/products");
const path = require("path");
const { ObjectIdValidator } = require("../../../validations/public.validator");
const createHttpError = require("http-errors");
const {StatusCodes:HttpStatus} = require("http-status-codes")

const ProductBlackList = {
    BOOKMARKS: "bookmarks",
    LIKES: "likes",
    DISLIKES: "dislikes",
    COMMENTS: "comments",
    SUPPLIER: "supplier",
    WEIGHT: "weight",
    WIDTH: "width",
    LENGTH: "length",
    HEIGHT: "height",
    COLORS: "colors"
  }
Object.freeze(ProductBlackList)

class ProductController extends Controller {
    
    async addProduct(req, res, next) {
        try {
            const images = ListOfImagesFromRequest(req?.files || [], req.body.fileUploadPath);
            const productBody = await createProductSchema.validateAsync(req.body);
            const instructor = req.user._id
            const {title,text,short_text,tags,category,price,count,discount,width,height,weight, length,colors,type} = productBody
            let features = setFeatures(req.body)
            // let type = "physical"

            
            // else{
            //     type = "digital"
            // }
            const product = await ProductModel.create({title,text,short_text,tags,category,price,count,discount,images,features,instructor,type,width,height,weight, length,colors})
            return res.status(HttpStatus.CREATED).json({
                status: 201,
                message: "Product Added Successfully",
                data:{
                    product
                }
            })
        } catch (error) {
            deleteFileInPublic(req.body.image)
            next(error);
        }
    }

    async editProduct(req, res, next) {
        try {
            const {id} = req.params
            const product = await ProductModel.findById({_id : id})
            const data = copyObject(req.body)
            data.images = ListOfImagesFromRequest(req?.files || [], req.body.fileUploadPath)
            data.features = setFeatures(req.body)
            let blackListData = Object.values(ProductBlackList)
            deleteInvalidPropertyInObject(data, blackListData)

            const updateProductResult = await ProductModel.updateOne({_id : product._id}, {$set: data})
            if(updateProductResult.modifiedCount == 0) throw {status: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error"}
            return res.status(HttpStatus.OK).json({
                status: HttpStatus.OK,
                message: "Product Updated Successfully",
                data:{
                    updateProductResult
                }
            })
        } catch (error) {
            next(error);
        }
    }
    async removeProductById(req, res, next) {
        try {
            const {id} = req.params
            const product = await ProductModel.findById({_id : id})
            // const product = await this.findProductById(id)
            const removeProduct = await ProductModel.deleteOne({_id : product._id})
            if(!removeProduct.deletedCount == 0) throw createHttpError.InternalServerError("Product not found")
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "Product deleted Successfully",
                data:{
                    product
                }
            })

        } catch (error) {
            next(error);
        }
    }
    async getAllProducts(req, res, next) {
        try {
            const search = req?.query?.search
            let products;

            if(search){
                products = await ProductModel.find({
                    $text: {
                        $search: new RegExp(search, "ig")
                    }
                })
            }
            else{
                products = await ProductModel.find({})
            }

            // const products = await ProductModel.find({})
            return res.status(HttpStatus.OK).json({
                
                statusCode: HttpStatus.OK,
                message: "Products fetched Successfully",
                data:{
                    products
                }
                
            })
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req, res, next) {
        try {
            const {id} = req.params
            const product = await ProductModel.findById(id)
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "Product fetched Successfully",
                data:{
                    product
                }
            })

        } catch (error) {
            next(error);
        }
    }

    async findProductById(productID){
        const {id} = ObjectIdValidator.validate({id: productID})
        const product = await ProductModel.findById(id)
        if(!product) throw createHttpError.NotFound("Product Not Found")
        return product
    }
}

module.exports = {
    ProductController : new ProductController()
}