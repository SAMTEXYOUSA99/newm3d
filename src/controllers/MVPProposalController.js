const MVPProposal = require('../models/MVPProposal');
const other = require('../services/mkpdfservicec');
const othera = require('../services/mkpdfservicea');

module.exports = {
    async store(req, res) {
        const {
            projectName,
            clientName,
            clientPhone,
            projectModelFirst,
            projectModelSecond,
            projectPrice,
            clientSource,
            projectServices,
            currentDate,
            projectDeadline,
            projectModelType,
            project_model, // new frontend field (e.g. "A interno")
            project_model_description, // preferred template text
            project_model_description_second,
            project_model_title,
            project_model_title_second
        } = req.body;

        let services = [];

        if (typeof projectServices !== 'string') {
            services = String(projectServices).split(',').map(tech => tech.trim());
        } else {
            console.error('projectServices is not a string:', projectServices);
        }

        console.log('qual é o conteudo:', projectModelSecond);
       
        let formattedProjectModelFirst = '';
        let formattedProjectModelSecond = '';

        // Prefer new payload descriptions if present
        const rawFirst = project_model_description || projectModelFirst || project_model_title || '';
        const rawSecond = project_model_description_second || projectModelSecond || project_model_title_second || '';

        if (!rawFirst) {
            console.log('projectModelFirst está vazio ou nulo');
        } else {
            formattedProjectModelFirst = String(rawFirst).replace(/;\s*/g, ';<br>');
        }

        if (!rawSecond) {
            console.log('projectModelSecond está vazio ou nulo');
        } else {
            formattedProjectModelSecond = String(rawSecond).replace(/;\s*/g, ';<br>');
        }
        
        console.log('formattedProjectModelFirst:', formattedProjectModelFirst);
        console.log('formattedProjectModelSecond:', formattedProjectModelSecond);
        
        try {
            // Salvar no banco de dados
            const mvpproposal = await MVPProposal.create({
                projectName,
                clientName,
                projectPrice,
                clientPhone,
                projectModelFirst:  formattedProjectModelFirst,
                projectModelSecond: formattedProjectModelSecond,
                clientSource,
                services,
                currentDate,
                projectDeadline,
                projectModelType
            });

            const pdfFileName = `${clientName} - ORÇAMENTO PROPOSTA DE INVESTIMENTO M3D STUDIO - ${projectName}.pdf`;
            
            // Determine model letter from old `projectModelType` or new `project_model` (e.g. "A interno")
            const modelSelector = (projectModelType || project_model || '').toString().trim();
            const modelLetter = modelSelector ? modelSelector.toUpperCase()[0] : '';

            if (modelLetter === 'A') {
                const pdfBufferA = await othera.generatePDF(mvpproposal);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
                res.send(pdfBufferA);
            } else if (modelLetter === 'C') {
                const pdfBufferC = await other.generatePDF(mvpproposal);
                console.log('nome arquivo:', pdfFileName);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
                res.send(pdfBufferC);
            } else {
                // Fallback: default to C templates if cannot determine
                console.warn('Could not determine model letter, falling back to C templates. modelSelector=', modelSelector);
                const pdfBufferC = await other.generatePDF(mvpproposal);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
                res.send(pdfBufferC);
            }
            

        } catch (error) {
            console.error('Error saving data and generating PDF:', error);
            return res.status(500).json({ error: 'Error saving data and generating PDF', details: error.message });
        }
    }
};
