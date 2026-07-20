const mongoose = require('mongoose');

const ContractJobSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['queued','processing','done','failed'], default: 'queued', index: true },
  outputKey: { type: String },
  error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ContractJob', ContractJobSchema);
