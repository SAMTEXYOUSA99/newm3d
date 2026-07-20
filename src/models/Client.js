const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
