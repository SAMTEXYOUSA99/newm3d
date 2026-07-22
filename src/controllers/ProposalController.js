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
        productionDays
      } = req.body;

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
      const projectDeadline = productionDays ? `${productionDays} dias` : '';

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
};
