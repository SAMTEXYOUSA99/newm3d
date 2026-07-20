const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
  status: { type: String, enum: ['Em elaboração','Enviado','Negociação','Fechado','Perdido'], default: 'Em elaboração', index: true },
  responsibleId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
