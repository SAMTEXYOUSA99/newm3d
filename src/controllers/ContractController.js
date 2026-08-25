const mongoose = require('mongoose');
const Contract = require('../models/Contract');
const Proposal = require('../models/Proposal');
const { generateContractPDF, getContractFilename } = require('../services/mkpdfservicecontract');

const PAYMENT_METHODS = Contract.PAYMENT_METHODS;
const EPSILON = 0.01;

function toNumber(value) {
  if (value === '' || value == null) return NaN;
  return Number(value);
}

async function findProposalByIdOrCode(proposalId) {
  if (!proposalId) return null;
  let proposal = null;
  if (/^ORC-/i.test(proposalId)) {
    proposal = await Proposal.findOne({ code: proposalId }).exec();
  }
  if (!proposal && mongoose.isValidObjectId(proposalId)) {
    proposal = await Proposal.findById(proposalId).exec();
  }
  return proposal;
}

async function findContractByIdOrCode(id) {
  if (!id) return null;
  let contract = null;
  if (/^CTR-/i.test(id)) {
    contract = await Contract.findOne({ code: id }).exec();
  }
  if (!contract && mongoose.isValidObjectId(id)) {
    contract = await Contract.findById(id).exec();
  }
  return contract;
}

function serializeContract(contract) {
  return {
    id: contract.code || String(contract._id),
    proposalId: contract.proposalSnapshot?.id || String(contract.proposal),
    contractant: contract.contractant,
    proposal: {
      title: contract.proposalSnapshot?.title || '',
      client: contract.proposalSnapshot?.client || '',
      services: contract.proposalSnapshot?.services || [],
      total: contract.total,
      projectDeadline: contract.projectDeadline
    },
    payment: contract.payment,
    status: contract.status,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt
  };
}

module.exports = {
  async store(req, res) {
    console.log('[ContractController.store] request received, body:', JSON.stringify(req.body));
    try {
      const user_id = req.headers.user_id || req.headers['user_id'];
      const { proposalId, contractant, proposal: proposalOverrides, payment, status } = req.body || {};
      console.log('[ContractController.store] user_id:', user_id, 'proposalId:', proposalId);

      if (!proposalId) {
        console.log('[ContractController.store] missing proposalId');
        return res.status(400).json({ error: 'proposalId is required' });
      }

      const proposal = await findProposalByIdOrCode(proposalId);
      console.log('[ContractController.store] proposal found:', proposal ? proposal._id : null);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      if (proposal.user && user_id && String(proposal.user) !== String(user_id)) {
        return res.status(403).json({ error: 'Proposal does not belong to the authenticated user' });
      }

      const hasName = Boolean(contractant?.fullName || contractant?.companyName);
      const hasDocument = Boolean(contractant?.cpf || contractant?.cnpj);
      const hasCityState = Boolean(contractant?.cityState);
      if (!hasName || !hasDocument || !hasCityState) {
        console.log('[ContractController.store] invalid contractant:', contractant);
        return res.status(400).json({ error: 'contractant.fullName or contractant.companyName, contractant.cpf or contractant.cnpj, and contractant.cityState are required' });
      }

      if (!payment || !PAYMENT_METHODS.includes(payment.method)) {
        console.log('[ContractController.store] invalid payment.method:', payment && payment.method);
        return res.status(400).json({ error: `payment.method must be one of: ${PAYMENT_METHODS.join(', ')}` });
      }

      const proposalTotal = Number(proposal.project_price || 0);
      const total = (proposalOverrides && proposalOverrides.total !== undefined && proposalOverrides.total !== '')
        ? toNumber(proposalOverrides.total)
        : proposalTotal;

      console.log('[ContractController.store] computed total:', total);
      if (!Number.isFinite(total) || total <= 0) {
        return res.status(400).json({ error: 'total must be a positive number' });
      }

      const projectDeadline = (proposalOverrides && proposalOverrides.projectDeadline) || proposal.projectDeadline || '';
      console.log('[ContractController.store] computed projectDeadline:', projectDeadline);
      if (!projectDeadline) {
        return res.status(400).json({ error: 'projectDeadline is required' });
      }

      const paymentDoc = {
        method: payment.method,
        dueDate: payment.dueDate || '',
        installments: payment.installments || '',
        notes: payment.notes || ''
      };

      if (payment.method === 'pix') {
        const pixEntry = toNumber(payment.pixEntry);
        const pixRemaining = toNumber(payment.pixRemaining);
        const hasInstallment2 = payment.pixInstallment2 !== undefined && payment.pixInstallment2 !== '' && payment.pixInstallment2 !== null;
        const pixInstallment2 = hasInstallment2 ? toNumber(payment.pixInstallment2) : 0;

        if (!Number.isFinite(pixEntry) || pixEntry <= 0) {
          return res.status(400).json({ error: 'payment.pixEntry must be a positive number' });
        }
        if (!Number.isFinite(pixRemaining) || pixRemaining < 0) {
          return res.status(400).json({ error: 'payment.pixRemaining must be zero or a positive number' });
        }
        if (hasInstallment2 && (!Number.isFinite(pixInstallment2) || pixInstallment2 <= 0)) {
          return res.status(400).json({ error: 'payment.pixInstallment2 must be a positive number' });
        }

        const sum = pixEntry + pixInstallment2 + pixRemaining;
        console.log('[ContractController.store] pix sum check:', { pixEntry, pixInstallment2, pixRemaining, sum, total });
        if (Math.abs(sum - total) > EPSILON) {
          return res.status(400).json({ error: `Sum of PIX installments (${sum.toFixed(2)}) must equal the contract total (${total.toFixed(2)})` });
        }

        paymentDoc.pixEntry = pixEntry;
        paymentDoc.pixRemaining = pixRemaining;
        if (hasInstallment2) paymentDoc.pixInstallment2 = pixInstallment2;
      }

      const payloadServices = Array.isArray(proposalOverrides?.services)
        ? proposalOverrides.services
        : Array.isArray(req.body?.services)
          ? req.body.services
          : proposal.project_services || [];
      const servicesSource = Array.isArray(proposalOverrides?.services)
        ? 'payload.proposal.services'
        : Array.isArray(req.body?.services)
          ? 'payload.services'
          : 'proposal.project_services';
      const services = payloadServices.map(s => ({
        id: s.id || '',
        title: s.title || s.label || s.name || '',
        price: Number(s.price || 0)
      }));
      console.log('[ContractController.store] services included in contract:', {
        proposalId: proposal.code || String(proposal._id),
        source: servicesSource,
        services
      });

      const contract = await Contract.create({
        proposal: proposal._id,
        user: user_id || proposal.user || undefined,
        proposalSnapshot: {
          id: proposal.code || String(proposal._id),
          title: proposal.projectName || '',
          client: proposal.clientName || '',
          projectModel: proposal.project_model || '',
          services
        },
        contractant: {
          fullName: contractant.fullName,
          cpf: contractant.cpf || '',
          birthDate: contractant.birthDate || '',
          companyName: contractant.companyName || '',
          cnpj: contractant.cnpj || '',
          address: contractant.address || '',
          cityState: contractant.cityState || '',
          email: contractant.email || '',
          phone: contractant.phone || ''
        },
        total,
        projectDeadline: String(projectDeadline),
        payment: paymentDoc,
        status: status || 'draft'
      });

      contract.code = `CTR-${String(contract._id).slice(-6).toUpperCase()}`;
      await contract.save();
      console.log('[ContractController.store] contract created:', contract.code, contract._id);

      return res.status(201).json(serializeContract(contract));
    } catch (err) {
      console.error('[ContractController.store] error:', err);
      return res.status(500).json({ error: 'Error creating contract', details: err.message });
    }
  },

  async index(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const perPage = Math.max(1, Math.min(100, parseInt(req.query.perPage, 10) || 12));
      const user_id = req.headers.user_id || req.headers['user_id'];

      const filter = {};
      if (user_id) filter.user = user_id;

      const total = await Contract.countDocuments(filter);
      const docs = await Contract.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      return res.json({ items: docs.map(serializeContract), total });
    } catch (err) {
      console.error('ContractController.index error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async show(req, res) {
    try {
      const contract = await findContractByIdOrCode(req.params.id);
      if (!contract) return res.status(404).json({ error: 'Not found' });
      return res.json(serializeContract(contract));
    } catch (err) {
      console.error('ContractController.show error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async pdf(req, res) {
    console.log('[ContractController.pdf] request received for id:', req.params.id);
    try {
      const contract = await findContractByIdOrCode(req.params.id);
      console.log('[ContractController.pdf] contract found:', contract ? contract.code : null);
      if (!contract) return res.status(404).json({ error: 'Not found' });

      console.log('[ContractController.pdf] generating PDF buffer...');
      const buffer = await generateContractPDF(contract);
      console.log('[ContractController.pdf] PDF buffer generated, bytes:', buffer ? buffer.length : 0);
      const filename = getContractFilename(contract);
      const fallbackFilename = filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ._-]/g, '')
        .replace(/\s+/g, ' ');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      return res.send(buffer);
    } catch (err) {
      console.error('[ContractController.pdf] error:', err);
      return res.status(500).json({ error: 'Error generating contract PDF', details: err.message });
    }
  }
};
