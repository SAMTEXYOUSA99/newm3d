const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  type: { type: String },
  message: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Activity', ActivitySchema);
