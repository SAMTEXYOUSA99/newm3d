const Proposal = require('../models/Proposal');
const mkpdfA = require('../services/mkpdfservicea');
const mkpdfC = require('../services/mkpdfservicec');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  async store(req, res) {
    try {
      const {
        project_model,
        project_price,
        clientName,
        clientPhone,
        projectName,
        clientSource,
        project_services,
        productionDays,
        projectDeadline
      } = req.body;
      console.log('projectdeadline', projectDeadline);
      const user_id = req.headers.user_id || req.headers['user_id'];

      // Normalize services
      let servicesArr = [];
      if (Array.isArray(project_services)) {
        servicesArr = project_services.map(s => ({
          id: s.id || '',
          label: s.label || (s.name || ''),
          price: s.price ? Number(s.price) : 0
        }));
      } else if (typeof project_services === 'string') {
        try {
          const parsed = JSON.parse(project_services);
          if (Array.isArray(parsed)) {
            servicesArr = parsed.map(s => ({ id: s.id || '', label: s.label || s.name || '', price: s.price ? Number(s.price) : 0 }));
          }
        } catch (e) {
          // fallback: split by comma
          servicesArr = String(project_services).split(',').map(s => ({ id: '', label: s.trim(), price: 0 }));
        }
      }

      const currentDate = new Date().toLocaleDateString('pt-BR');

      // Map to fields expected by existing PDF services
      // Support new frontend payload keys like `project_model_description` and `project_model_title`.
      let projectModelFirst = '';
      let projectModelSecond = '';

      if (req.body.project_model_description) {
        projectModelFirst = req.body.project_model_description;
      } else if (req.body.project_model_title) {
        projectModelFirst = req.body.project_model_title;
      } else if (project_model) {
        // fallback: use the raw project_model value (could be type or short id)
        projectModelFirst = project_model;
      }

      const mvppayload = {
        projectName,
        clientName,
        clientPhone,
        projectPrice: project_price,
        clientSource,
        services: servicesArr.map(s => s.label),
        projectServices: servicesArr.map(s => s.label).join(','),
        currentDate,
        projectDeadline,
        projectModelType: project_model,
        projectModelFirst,
        projectModelSecond
      };

      // Create DB record first
      const proposal = await Proposal.create({
        project_model,
        project_price,
        clientName,
        clientPhone,
        projectName,
        clientSource,
        project_services: servicesArr,
        productionDays,
        currentDate,
        projectDeadline,
        user: user_id || undefined
      });

      // Ensure a searchable `code` is persisted (e.g. ORC-ABC123)
      if (!proposal.code) {
        proposal.code = `ORC-${String(proposal._id).slice(-6).toUpperCase()}`;
        try { await proposal.save(); } catch (e) { /* ignore save errors (e.g. rare unique conflicts) */ }
      }

      // Generate PDF using appropriate service
      let pdfBuffer;
      if (String(project_model).toUpperCase() === 'A') {
        pdfBuffer = await mkpdfA.generatePDF(mvppayload);
      } else {
        pdfBuffer = await mkpdfC.generatePDF(mvppayload);
      }

      // ensure pdfpublic exists
      const basePdfDir = path.join(__dirname, '../../pdfpublic');
      try {
        await fs.mkdir(basePdfDir, { recursive: true });
      } catch (e) {
        // ignore
      }

      const modelDir = String(project_model).toLowerCase() === 'a' ? 'modela' : 'modelc';
      const targetDir = path.join(basePdfDir, modelDir);
      try { await fs.mkdir(targetDir, { recursive: true }); } catch (e) {}

      const safeClient = (clientName || 'client').replace(/[^a-z0-9\-_. ]/gi, '_');
      const safeProject = (projectName || 'project').replace(/[^a-z0-9\-_. ]/gi, '_');
      const pdfFileName = `${safeClient} - PROPOSTA - ${safeProject}.pdf`;
      const pdfPath = path.join(targetDir, pdfFileName);

      await fs.writeFile(pdfPath, pdfBuffer);

      // update proposal with pdf file name
      proposal.pdfFileName = path.join(modelDir, pdfFileName);
      await proposal.save();

      return res.json(proposal);
    } catch (error) {
      console.error('Error in ProposalController.store:', error);
      return res.status(500).json({ error: 'Error creating proposal', details: error.message });
    }
  }
  ,
  async index(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const perPage = Math.max(1, Math.min(100, parseInt(req.query.perPage, 10) || 12));
      const q = req.query.q;
      const status = req.query.status;

      const filter = {};
      if (status) filter.status = status;
      if (q) {
        const regex = new RegExp(q, 'i');
        filter.$or = [
          { projectName: regex },
          { clientName: regex },
          { 'project_services.label': regex }
        ];
      }

      const total = await Proposal.countDocuments(filter);
      const docs = await Proposal.find(filter)
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      const items = docs.map(d => {
        const id = d.code || `ORC-${String(d._id).slice(-6).toUpperCase()}`;
        return {
          id,
          title: d.projectName || '',
          client: d.clientName || '',
          value: typeof d.project_price === 'number' ? d.project_price : Number(d.project_price || 0),
          projectDeadline: d.projectDeadline || '',
          productionDays: d.productionDays || 0,
          status: d.status || 'Em elaboração',
          updated: d.currentDate || d.createdAt,
          team: d.user ? [{ name: d.user.name }] : []
        };
      });

      return res.json({ items, total });
    } catch (err) {
      console.error('ProposalController.index error:', err);
      return res.status(500).json([{ message: 'Server error', code: 'server_error' }]);
    }
  },

  async show(req, res) {
    try {

      const id = req.params.id;
      let proposal = null;

      if (/^ORC-/i.test(id)) {
        proposal = await Proposal.findOne({ code: id }).populate('user', 'name').exec();
      }

      if (!proposal) {
        try {
          proposal = await Proposal.findById(id).populate('user', 'name').exec();
        } catch (e) {
          // ignore
        }
      }

      if (!proposal) {
        return res.status(404).json({ message: 'Not found' });
      }

      console.log('ProposalController.show projectDeadline:', proposal.projectDeadline);

      const idOut = proposal.code || `ORC-${String(proposal._id).slice(-6).toUpperCase()}`;
      const subtotal = Array.isArray(proposal.project_services)
        ? proposal.project_services.reduce((s, it) => s + (Number(it.price) || 0), 0)
        : 0;
      const discount = Number(proposal.discount || 0);
      const taxes = Math.round(subtotal * 0.05);
      const total = subtotal - discount + taxes;
      const marginPct = Number(proposal.marginPct || 35);
      const estimatedProfit = Math.round(total * (marginPct / 100));

      const response = {
        id: idOut,
        project_model: proposal.project_model || '',
        projectDeadline: proposal.projectDeadline || '',
        productionDays: proposal.productionDays || 0,
        title: proposal.projectName || '',
        client: proposal.clientName || '',
        createdAt: proposal.createdAt,
        status: proposal.status || 'Em elaboração',
        responsible: proposal.user ? { name: proposal.user.name, avatar: proposal.user.avatar || null } : null,
        project_price: Number(proposal.project_price || 0),
        subtotal,
        discount,
        taxes,
        total,
        marginPct,
        estimatedProfit,
        products: (proposal.project_services || []).map((p, idx) => ({ id: idx + 1, title: p.label || p.name || '', desc: '', qty: 1, unit: Number(p.price || 0), total: Number(p.price || 0) })),
        activities: proposal.activities || [],
        files: proposal.pdfFileName ? [{ id: 'pdf1', name: proposal.pdfFileName, size: null, type: 'pdf', uploadedAt: proposal.createdAt }] : (proposal.files || [])
      };

      return res.json(response);
    } catch (err) {
      console.error('ProposalController.show error:', err);
      return res.status(500).json([{ message: 'Server error', code: 'server_error' }]);
    }
  }
};
