const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const mongoose = require('mongoose')


const createCart = async (req, res) => {
    let userId = req.params.userId
    let { productId, cartId } = req.body

    let ObjectId = mongoose.Types.ObjectId
    try {

        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid userId.....' })
        } else if (!ObjectId.isValid(productId)) {
            return res.status(400).send({ status: false, message: 'Invalid productId.....' })
        }

        let findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(400).send({ status: false, message: 'User Not Found..' })
        }
        let findUserCart = await cartModel.findOne({ userId: userId })
        if (findUserCart) {
            if (productId && cartId) {
                if (!ObjectId.isValid(cartId)) {
                    return res.status(400).send({ status: false, message: 'Invalid cartId' })
                }
                let checkCartAvailability = await cartModel.findOne({ _id: cartId })
                if (!checkCartAvailability) {
                    return res.status(400).send({ status: false, message: 'Cart Not found..' })
                }
                let checkProductAvailability = await productModel.findOne({ _id: productId, isDeleted: false })
                if (!checkProductAvailability) {
                    return res.status(400).send({ status: false, message: 'Product Not found..' })
                }



                
            } else {
                return res.status(400).send({ status: false, message: 'Cart Already Exists Please add Cart Id..' })
            }

        }
        else {

            let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!findProduct) {
                return res.status(400).send({ status: false, message: 'Product Not Found..' })
            }

            let createCart = await cartModel.create({ userId: findUser._id, items: { productId: findProduct._id, quantity: 1 }, totalPrice: findProduct.price, totalItems: 1 })
            res.send(createCart)
        }


    } catch (error) {
        res.send(error.message)
    }
}



module.exports = { createCart }