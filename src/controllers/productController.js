const checkValid = require('../validations/validators')
const awsConnect = require('../aws_connect/connect_aws')
const productModel = require('../models/productModel')
const { default: mongoose } = require('mongoose')


const createProduct = async (req, res) => {

    const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = req.body

    let decimalPrice = parseFloat(price);

    if (!checkValid.bodyValidation(req.files) || !checkValid.bodyValidation(req.body)) {
        return res.status(400).send({ status: false, message: "All fields are compulsary.." })
    }
    if (!title || !checkValid.isValidName(title) || !checkValid.checkBlankValues(title)) {

        return res.status(400).send({ status: false, message: "Characters and Nos are allowed in Title, special Characters are not allowed !!" })

    } else if (!description || !checkValid.checkBlankValues(description)) {

        return res.status(400).send({ status: false, message: "Description cannot be Blank !!" })
    }
    else if (!decimalPrice || !checkValid.decimalNoValidator(decimalPrice)) {

        return res.status(400).send({ status: false, message: "Please insert proper Price !!" })
    }
    else if (!currencyId || currencyId != "INR" || !checkValid.checkBlankValues(currencyId)) {

        return res.status(400).send({ status: false, message: "Currency Id Should Be INR, Extra Spaces are not allowed." })
    }
    else if (!currencyFormat || currencyFormat != "₹" || !checkValid.checkBlankValues(currencyFormat)) {

        return res.status(400).send({ status: false, message: "currencyFormat Should Be ₹, Extra Spaces are not allowed." })
    }
    else if (isFreeShipping) {

        if (isFreeShipping != "true" && isFreeShipping != "false") return res.status(400).send({ status: false, message: "isFreeShipping Should Be true or false Only, Extra Spaces are not allowed." })
    }


    if (!style || !checkValid.checkBlankValues(style) || !checkValid.stringValidation(style)) {
        return res.status(400).send({ status: false, message: "Only Characters are allowed in style, Blank spaces & Special characters are not allowed" })
    }
    else if (installments && !checkValid.isValidInstallment(installments)) {
        return res.status(400).send({ status: false, message: "Installments should be in Numbers Only." })
    }

    let insertedSizes = [];
    if (!availableSizes) {
        return res.status(400).send({ status: false, message: "Available Sizes are required and it should be S, XS, M, X, L, XXL, XL." })
    }
    else if (availableSizes) {
        let sizesarr = availableSizes.trim().split(",")
        let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        for (i = 0; i < sizesarr.length; i++) {

            if (!(sizes.includes(sizesarr[i].trim()))) {
                return res.status(400).send({ status: false, message: "Sizes should be S, XS, M, X, L, XXL, XL." })
            }
            else {
                insertedSizes.push(sizesarr[i].trim())
            }
        }
    }
    let productLink;
    if (req.files && req.files.length > 0) {
        let upLoadedProfileImage = await awsConnect.uploadProductImage(req.files[0])
        productLink = upLoadedProfileImage
    } else {
        return res.status(400).send({ status: false, message: "ProductImage required, error in uploading ProductImage" })
    }

    productImage = productLink
    let data = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments }
    data.availableSizes = insertedSizes

    let checkAvailableProduct = await productModel.findOne({ title: title })

    if (checkAvailableProduct) {
        return res.status(400).send({ status: false, message: "Product Already Exists" })
    } else {
        let createdProduct = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: createdProduct })
    }

}

// -------------get Product Starts here _________________

const getProducts = async (req, res) => {

    let { priceGreaterThan, priceLessThan, size, name, priceSort } = req.query

    if (Object.keys(req.query) <= 1) {
        let allProducts = await productModel.find({ isdeleted: false })

        return res.status(200).send({ status: true, message: allProducts })
    }
    let filter = {}

    if (priceGreaterThan && !checkValid.validNos(priceGreaterThan)) return res.send({ status: false, error: "GreaterThan price should be in Decimal format" })

    if (priceLessThan && !checkValid.validNos(priceLessThan)) return res.send({ status: false, error: "LessThan price should be in Decimal format" })

    let grs = parseFloat(priceGreaterThan)
    let lrs = parseFloat(priceLessThan)

    if (grs) {
        filter.isDeleted = false
        filter.price = { $gte: grs }
    }
    if (lrs) {
        filter.isDeleted = false
        filter.price = { $lte: lrs }
    }
    if (grs && lrs) {
        filter.isDeleted = false
        filter.price = { $gte: grs, $lte: lrs }
    }
    if (size) {
        size = size.split(",")
        filter.isDeleted = false
        filter.availableSizes = { $in: size }
    }
    if (name) {
        filter.isDeleted = false
        filter.title = { $regex: name, $options: "i" }
    }
    let sort = parseFloat(priceSort)
    if (sort && !checkValid.isValidSort(sort)) return res.status(400).send({ status: false, message: "Sorting type should be 1 or -1" })

    if (Object.keys(filter).length <= 1) return res.status(400).send({ status: false, message: "Please Insert values to be filtered..." })

    let filteredData = await productModel.find(filter)

    if (Object.keys(filteredData).length < 1) {
        return res.status(400).send({ status: false, message: "No product found.." })
    }

    if (sort == 1) {
        filteredData.sort((a, b) => {
            return a.price - b.price;
        });
    }
    if (sort == -1) {
        filteredData.sort((a, b) => {
            return b.price - a.price;
        });
    }


    res.status(200).send({ status: true, filteredData: filteredData })
}


const getProductById = async (req, res) => {
    let productId = req.params.productId
    let ObjectId = mongoose.Types.ObjectId

    if (!ObjectId.isValid(productId)) {
        return res.status(400).send({ status: false, message: "invalid Product Id" })
    }

    let product = await productModel.find({ _id: productId, isDeleted: false }).select({ __v: 0 })


    if (product == null) {
        return res.status(400).send({ status: false, message: "Product Not Found" })
    }

    res.status(200).send({ status: true, message: product })

}


const updateProduct = async (req, res) => {
    let productId = req.params.productId

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = req.body

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({ status: false, messgae: "invalid Product ID" })
    }

    if (Object.keys(req.body).length < 1) {
        return res.status(400).send({ status: false, messgae: "Please Insert some values to edit...." })
    }

    if (title && !checkValid.isValidName(title) || !checkValid.checkBlankValues(title)) {
        return res.status(400).send({ status: false, message: "Special characters or Blank Values are not allowed In name" })
    }
    if (description && !checkValid.checkBlankValues(description) || !checkValid.empty(description)) {
        return res.status(400).send({ status: false, message: "Blank Values are not allowed In Description" })
    }

    let prices = parseFloat(price)
    if (price && !checkValid.checkBlankValues(price) && !checkValid.decimalNoValidator(prices)) {
        return res.status(400).send({ status: false, message: "Please enter Valid price" })
    }
    if (currencyFormat && currencyFormat != "₹" || !checkValid.checkBlankValues(currencyFormat)) {
        return res.status(400).send({ status: false, message: "currencyFormat Should Be ₹, Extra Spaces are not allowed." })
    }
    if ((currencyId && currencyId != "INR") || !checkValid.empty(currencyId)) {
        return res.status(400).send({ status: false, message: "Currency Id cannot be changed.." })
    }
    if (isFreeShipping) {
        if (isFreeShipping != "true" && isFreeShipping != "false") return res.status(400).send({ status: false, message: "isFreeShipping Should Be true or false Only, Extra Spaces are not allowed." })
    }
    if ((style && !checkValid.empty(style)) || !checkValid.checkBlankValues(style)) {
        return res.status(400).send({ status: false, message: "Blank Values are not allowed In Style" })
    }
    if ((installments && !checkValid.empty(style)) && !checkValid.isValidInstallment(installments) && !checkValid.checkBlankValues(installments)) {
        return res.status(400).send({ status: false, message: "Please provide Proper Installmets" })
    }
    let productLink;
    if (req.files && req.files.length > 0) {

        let upLoadedProfileImage = await awsConnect.uploadProductImage(req.files[0])
        productLink = upLoadedProfileImage
        if (!awsConnect.uploadProductImage) {
            return res.status(400).send({ status: false, message: "Error in Image uploading.." })
        }
    }
    insertedSizes = new Array;
    let sizesarr;
    if (availableSizes) {
        sizesarr = availableSizes.split(",").map(ele => ele.trim());
        let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        for (i = 0; i < sizesarr.length; i++) {

            if (!(sizes.includes(sizesarr[i].trim()))) {
                return res.status(400).send({ status: false, message: "Sizes should be S, XS, M, X, L, XXL, XL." })
            }
            else {
                insertedSizes.push(sizesarr[i].trim())

            }
        }
    }


    let updatedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false },
        {
            $set:
            {
                title: title,
                description: description,
                currencyFormat: currencyFormat,
                isFreeShipping: isFreeShipping,
                price: price,
                productImage: productLink,
                style: style,
                availableSizes: sizesarr,
                installments: installments
            }
        },
        { new: true })

    res.status(200).send({ status: true, message: "Successfully Updated", data: updatedProduct })
}


const deleteProduct = async (req, res) => {
    let productId = req.params.productId
    let ObjectId = mongoose.Types.ObjectId

    if (!ObjectId.isValid(productId)) {
        return res.status(400).send({ status: false, message: "invalid Product Id" })
    }

    let deletedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true }).select({ __v: 0 })

    if (deletedProduct == null) {
        return res.status(400).send({ status: false, message: "Product Not Found" })
    }

    res.status(200).send({ status: true, message: "data deleted Successfully", data: deletedProduct })

}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct }