window.PaymentService = {
  API_URL: 'http://localhost:5000/api/payment',

  getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  },

  async getCheckoutSummary() {
    const response = await fetch(
      `${this.API_URL}/checkout-summary`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data.totals;
  },

  async createPaymentOrder(amount) {
    const response = await fetch(
      `${this.API_URL}/create-order`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data.order;
  },
};