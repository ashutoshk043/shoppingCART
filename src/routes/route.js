const express = require('express');
const router = express.Router();
const { createUser, loginUser, getUserDetails , updateUser} = require('../controllers/userController')
const {createProduct, getProducts, getProductById, updateProduct ,deleteProduct } = require('../controllers/productController')
const {createCart} = require('../controllers/cartController')
const { authentication, authorization } = require('../middleware/auth')
const auth = require('../middleware/auth')


// _____Phase 1 _____________
router.post('/register', createUser)
router.post('/login', loginUser)
router.get('/user/:userId/profile', authentication, getUserDetails)
router.put('/user/:userId/profile', authentication, authorization,  updateUser)

//______Phase 2 ___________________

router.post('/products', createProduct)
router.get('/products', getProducts)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProduct)
router.delete('/products/:productId', deleteProduct)

// ---------------Phase 3 ----------------------
router.post('/users/:userId/cart', createCart)

module.exports = router;