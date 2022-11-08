const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');

const authentication = (req, res, next) => {
    try {

        let bearerToken = req.headers['authorization']
        let token = bearerToken.replace("Bearer ", '');
        if (!token) {
            return res.status(400).send({ status: false, message: "Token not found!!!" })
        } else {
            jwt.verify(token, 'shoppingCartSecreteKey', function (err, decoded) {
                if (err) {

                    return res.status(400).send({ status: false, message: err })
                    /*
                      err = {
                        name: 'TokenExpiredError',
                        message: 'jwt expired',
                        expiredAt: 1408621000
                      }
                    */

                }
                else {
                    next()
                }
            });
        }
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const authorization = (req, res, next) => {

    let userId = req.params.userId
    let token = req.headers['authorization']
    let ObjectId = mongoose.Types.ObjectId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, error: "Invalid User Id" })
    } else {
        jwt.verify(token, "shoppingCartSecreteKey", function (err, decoded) {
            if (err) {
                return res.status(401).send({ status: "false", message: err })
            } else if (userId != decoded.user._id) {
                return res.status(400).send({ status: "false", message: "Unauthorized User..." })
            } else {
                next()
            }
        })
    }

}
module.exports = { authentication, authorization }
