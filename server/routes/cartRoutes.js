const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  mergeCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');

router.use(protect);

router.get('/', getCart);
router.post('/merge', mergeCart);
router.post('/items', addCartItem);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);

module.exports = router;
