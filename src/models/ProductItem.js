const mongoose = require('mongoose');

const ProductItemSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  position: { type: Number, default: 0 },
  title: { type: String },
  description: { type: String },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ProductItem', ProductItemSchema);
