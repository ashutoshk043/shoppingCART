const express = require('express');
const multer = require('multer')
const bodyParser = require('body-parser');
const route = require('./routes/route');
const mongoose  = require('mongoose');


const app = express();
app.use(multer().any())
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://ashutoshk043-1998:U8QSwvpHF19IjV7W@cluster0.yxszvwn.mongodb.net/shoppingCart", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is Connected."))
    .catch(error => console.log(error))

app.use('/', route)

app.use(function (req, res) {
    let err = new Error("Not Found.")
    err.status = 400
    return res.status(400).send({ status: false, msg: "Invalid Url" })
})

app.listen(process.env.PORT || 3000, function () {
    console.log('Express App Running on Port: ' + (process.env.PORT || 3000))
});