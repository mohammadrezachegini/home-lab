const {default: mongoose} = require("mongoose")

const PaymentSchema = new mongoose.Schema({


});

module.exports = {
    PaymentModel: mongoose.model("payment", PaymentSchema)
}