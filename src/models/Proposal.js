const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  project_model: String,
  project_price: Number,
  clientName: String,
  clientPhone: String,
  projectName: String,
  clientSource: String,
  project_services: [
    {
      id: String,
      label: String,
      price: Number,
    }
  ],
  productionDays: Number,
  currentDate: String,
  projectDeadline: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserM3D'
  },
  pdfFileName: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Proposal', ProposalSchema);
