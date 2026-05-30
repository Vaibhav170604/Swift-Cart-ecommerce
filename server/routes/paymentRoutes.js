const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createOrder,
  verifyPayment,
  getCheckoutSummary,
} = require('../controllers/paymentController');

router.use(protect);

router.post('/create-order', createOrder);

router.post('/verify', verifyPayment);

router.get('/checkout-summary', getCheckoutSummary);


module.exports = router;