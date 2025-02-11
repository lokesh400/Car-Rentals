const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  name: String,
  message: String,
  mobile: String,
});

const Query = mongoose.model('Query', QuerySchema);
module.exports = Query;
