// ==========================================
// SwiftCart Profile Service
// ==========================================

const ProfileService = {
  API_URL: 'http://localhost:5000/api',

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async fetchProfile() {
    const response = await fetch(`${this.API_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load profile.');
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data.user;
  },

  async updateProfile({ name, email, currentPassword, newPassword }) {
    const body = { name, email };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const response = await fetch(`${this.API_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile.');
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
};
