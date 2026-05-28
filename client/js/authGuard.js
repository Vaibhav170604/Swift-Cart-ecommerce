// ==========================================
// SwiftCart Auth Guard (Protected pages/actions)
// ==========================================

const AuthGuard = {
  requirePageAuth(message = 'Please sign in to view this page.') {
    if (localStorage.getItem('token')) {
      return true;
    }
    CartService.redirectToLogin(message);
    return false;
  },

  requireCheckoutAuth() {
    return this.requirePageAuth('Please sign in to proceed to checkout.');
  },

  requireOrdersAuth() {
    return this.requirePageAuth('Please sign in to view your orders.');
  },

  requireProfileAuth() {
    return this.requirePageAuth('Please sign in to view your profile.');
  },
};
