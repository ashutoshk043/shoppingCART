const mongoose = require('mongoose')
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const awsConnect = require('../aws_connect/connect_aws')
const jwt = require('jsonwebtoken');

const nameRegex = /^[a-zA-Z_ ]*$/;
const emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
const vaildPinRegex = /^[1-9]{1}[0-9]{2}[0-9]{3}$/;

const createUser = async function (req, res) {
    try {
        let { fname, lname, email, phone, password, profileImage } = req.body

        let address = JSON.parse(req.body.address)

        if (!fname) {
            return res.status(400).send({ status: false, message: "FirstName is required !!" })
        }
        else if (!lname) {
            return res.status(400).send({ status: false, message: "LastName  is required !!" })
        }
        else if (!nameRegex.test(fname) && !nameRegex.test(lname)) {
            return res.status(400).send({ status: false, message: "Only characters are allowed in firstName and lastName!!" })
        }
        else if (!email) {
            return res.status(400).send({ status: false, message: "Email  is required !!" })
        }
        else if (!emailRegex.test(email)) {
            return res.status(400).send({ status: false, message: "Invalid Email !!" })
        }
        else if (!phone) {
            return res.status(400).send({ status: false, message: "Mobile is Required !!" })
        }
        else if (!phoneRegex.test(phone)) {
            return res.status(400).send({ status: false, message: "Invalid Mobile!!" })
        }
        else if (!password) {
            return res.status(400).send({ status: false, message: "Password is Required!!" })
        }
        else if (!passwordRegex.test(password)) {
            return res.status(400).send({ status: false, message: "Password length should be from 8 to 15 !!!" })
        }
        else if (Object.keys(address).length < 1) {
            return res.status(400).send({ status: false, message: "All Address fields are mendatory!!" })
        }
        else if (Object.keys(address.shipping).length < 1) {
            return res.status(400).send({ status: false, message: "Shipping Address required !!!" })
        }
        else if (!address.shipping.street) {
            return res.status(400).send({ status: false, message: "Street required !!!" })
        }
        else if (!address.shipping.city) {
            return res.status(400).send({ status: false, message: "City required !!!" })
        } else if (!address.shipping.pincode) {
            return res.status(400).send({ status: false, message: "Pincode required !!!" })
        }
        else if (!vaildPinRegex.test(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Invalid shipping Pincode !!!" })
        }
        else if (Object.keys(address.billing).length < 1) {
            return res.status(400).send({ status: false, message: "Billing Address required !!!" })
        }
        else if (!address.billing.street) {
            return res.status(400).send({ status: false, message: "Street required !!!" })
        }
        else if (!address.billing.city) {
            return res.status(400).send({ status: false, message: "City required !!!" })
        }
        else if (!address.billing.pincode) {
            return res.status(400).send({ status: false, message: "Pincode required !!!" })
        }
        else if (!vaildPinRegex.test(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Invalid Billing Pincode !!!" })
        }
        else {
            let findUser = await userModel.find({ $or: [{ email: email }, { phone: phone }] })
            if (Object.keys(findUser).length > 0) {
                return res.status(400).send({ status: false, message: "user already registered with this mobile and email!!" })
            } else {
                // password-hasing
                let hashedPass = await bcrypt.hash(password, 10)
                // AWS CODE here
                let pImage = req.files
                if (!(pImage && pImage.length)) {
                    return res.status(401).send({ status: "false", msg: "Found Error in Uploading files..." })
                } else {

                    let upLoadedProfile = await awsConnect.uploadFile(pImage[0])
                    password = hashedPass  // Password updated from destructured 
                    profileImage = upLoadedProfile // aws link of profile image updated from destructured

                    let createUser = { fname, lname, email, profileImage, phone, password, address }

                    let createdUser = await userModel.create(createUser)
                    return res.status(201).send({ status: true, data: createdUser })
                }
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const loginUser = async (req, res) => {

    try {
        let credentials = req.body;
        let { email, password } = { ...credentials };

        if (Object.keys(req.body).length == 0) {
            return res
                .status(400)
                .send({ status: false, data: "Login Credential required !!!" });
        }
        if (!email || !password) {
            return res.status(400).send({
                status: false,
                data: "Email and Password Both are required...",
            });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).send({ status: false, data: "Invalid Email!!!" });
        }

        if (!passwordRegex.test(req.body.password))
            return res.status(400).send({
                status: false,
                msg: "Password must have 8 to 15 characters with at least one lowercase, uppercase, numeric value and a special character",
            });

        let user = await userModel.findOne({ email: email });
        if (!user)
            return res.status(400).send({ status: false, data: "User Not Found" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send({ status: false, data: "Invalid Password" });
        } else {
            var token = jwt.sign({ user }, "shoppingCartSecreteKey", {
                expiresIn: "24hr",
            }); // will expire in 1hr
            let userId = user._id;
            let loginData = { userId, token };
            res.status(200).send({
                status: true,
                message: "User login successfull",
                data: loginData,
            });
        }
    } catch (err) {
        res.status(500).send({ status: "error", error: err.message });
    }
};


const getUserDetails = async (req, res) => {
    try {

        let ObjectId = mongoose.Types.ObjectId
        let UserId = req.params.userId
        if (!ObjectId.isValid(UserId)) {
            return res.status(400).send({ status: false, error: "Invalid UserId." })
        } else {
            let findUser = await userModel.findById(UserId)
            if (!findUser) {
                return res.status(400).send({ status: false, error: "User Not Found." })
            } else {
                return res.status(201).send({ status: true, message: "user profile Details.", data: findUser })
            }
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

const updateUser = async (req, res) => {
    try {

        let { fname, lname, email, phone, password } = req.body

        let hashedPass;  // declearing a global variable.. 

        if (fname && !nameRegex.test(fname)) {
            return res.status(400).send({ status: false, message: "Only characters are allowed in firstName !!" })
        }
        else if (lname && !nameRegex.test(lname)) {
            return res.status(400).send({ status: false, message: "Only characters are allowed in lastName!!" })
        }
        else if (email && !emailRegex.test(email)) {
            return res.status(400).send({ status: false, message: "Invalid Email !!" })
        }
        else if (phone && !phoneRegex.test(phone)) {
            return res.status(400).send({ status: false, message: "Invalid phone !!" })
        }
        else if (password && !passwordRegex.test(password)) {
            return res.status(400).send({ status: false, message: "Password must have 8 to 15 characters with at least one lowercase, uppercase, numeric value and a special character" })
        }
        else if (password) {
            hashedPass = await bcrypt.hash(password, 10)
        }
        let address;  // declearing Gobal Variables
        if (req.body.address) {
            address = JSON.parse(req.body.address)

            if (Object.keys(address).length > 0)

                if (Object.keys(address.shipping).length > 0) {
                    if (!vaildPinRegex.test(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Invalid shipping Pincode !!!" })
                    }
                }
            if (address.shipping.street) {
                let checkBlank = (address.shipping.street).trim()
                if (checkBlank.length === 0) {
                    return res.status(400).send({ status: false, message: "Blank Fields are not allowed shipping street!!!" })
                }
            }
            if (address.shipping.city) {
                let checkBlank = (address.shipping.city).trim()
                if (checkBlank.length === 0) {
                    return res.status(400).send({ status: false, message: "Blank Fields are not allowed in shipping city!!!" })
                }
            }
            if (address.billing.street) {
                let checkBlank = (address.billing.street).trim()
                if (checkBlank.length === 0) {
                    return res.status(400).send({ status: false, message: "Blank Fields are not allowed  in Billing Street!!!" })
                }
            }
            if (address.billing.city) {
                let checkBlank = (address.billing.city).trim()
                if (checkBlank.length === 0) {
                    return res.status(400).send({ status: false, message: "Blank Fields are not allowed in billing city!!!" })
                }
            }
            if (address.billing.pincode) {
                if (!vaildPinRegex.test(address.billing.pincode)) {
                    return res.status(400).send({ status: false, message: "Invalid billing Pincode !!!" })
                }
            }
        }
        let upLoaded;
        if (req.files && req.files.length > 0) {
            upLoaded = await awsConnect.uploadFile(req.files[0])
        }
        if (req.files.length === 0) {

        }
        // let dataToBeUpdated = {fname, lname, email, phone, hashedPass,profileImage, address}
        rUid = req.params.userId
        let updatedData = await userModel.findOneAndUpdate({ _id: rUid }, { $set: { fname: fname, lname: lname, email: email, phone: phone, password: hashedPass, profileImage: upLoaded, address: address } }, { new: true, upsert: true })
        res.status(201).send({ status: true, message: "Data Updated successfully", data: updatedData })
    } catch (error) {
        return res.status(400).send({ status: false, message: "Please insert any details to update!!" })
    }
}

module.exports = { createUser, loginUser, getUserDetails, updateUser }