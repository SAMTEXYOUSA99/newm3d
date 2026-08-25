const mongoose = require('mongoose');

const PAYMENT_METHODS = ['avista', 'pix', 'cartao_credito'];

const ContractSchema = new mongoose.Schema({
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserM3D' },
  code: { type: String, index: { unique: true, sparse: true } },

  // Snapshot of proposal data at contract creation time. The Proposal document remains the source of truth.
  proposalSnapshot: {
    id: String,
    title: String,
    client: String,
    projectModel: String,
    services: [
      {
        id: String,
        title: String,
        price: Number
      }
    ]
  },

  contractant: {
    fullName: String,
    cpf: String,
    birthDate: String,
    companyName: String,
    cnpj: String,
    address: String,
    cityState: String,
    email: String,
    phone: String
  },

  total: { type: Number, required: true, min: 0 },
  projectDeadline: { type: String, required: true },

  payment: {
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    dueDate: String,
    installments: String,
    notes: String,
    pixEntry: Number,
    pixInstallment2: Number,
    pixRemaining: Number
  },

  status: { type: String, default: 'draft' }
}, { timestamps: true });

const Contract = mongoose.model('Contract', ContractSchema);
Contract.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = Contract;
