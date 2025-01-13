const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: String,
  brand: String,
  year: Number,
  pricePerDay: Number,
  available: { type: Boolean, default: true },
  photo: String,
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
