const MVPProposal = require('../models/MVPProposal');
const PDFServiceA = require('../services/PDFServiceA');
const PDFServiceC = require('../services/PDFServiceC');
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
        
        if (!projectModelFirst) {
            console.log('projectModelFirst está vazio ou nulo');
        } else {
            formattedProjectModelFirst = projectModelFirst.replace(/;\s*/g, ';<br>');
        }
        
        if (!projectModelSecond) {
            console.log('projectModelSecond está vazio ou nulo');
        } else {
            formattedProjectModelSecond = projectModelSecond.replace(/;\s*/g, ';<br>');
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
            
            if (projectModelType === 'A') {
                // Gerar o PDF usando o serviço dedicado
                const pdfBufferA = await othera.generatePDF(mvpproposal);

                 // Definir headers para a resposta do PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
                res.send(pdfBufferA);
            } else if (projectModelType === 'C') {
                // Gerar o PDF usando o serviço dedicado
                const pdfBufferC = await other.generatePDF(mvpproposal);
                console.log('nome arquivo:', pdfFileName);
                 // Definir headers para a resposta do PDF
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
