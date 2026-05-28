const SHIPPING_COST = 5.99;
const FREE_SHIPPING_MIN = 50;
const TAX_RATE = 0.08;

const calculateOrderTotals = (subtotal) => {
  const shippingCost = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount =
    Math.round((subtotal + shippingCost + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCost,
    taxAmount,
    totalAmount,
  };
};

module.exports = {
  SHIPPING_COST,
  FREE_SHIPPING_MIN,
  TAX_RATE,
  calculateOrderTotals,
};
