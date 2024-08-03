const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  dob: Date,
  country: String,
  favoriteDestination: String,
  travelStyle: String,
  interests: [String]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
