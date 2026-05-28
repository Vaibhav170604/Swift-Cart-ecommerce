const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      // Password is required unless user has Google ID
      return !this.googleId;
    },
    minlength: 6,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
