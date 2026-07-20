const contractQueue = require('../queues/contractQueue');
const ContractJob = require('../models/ContractJob');
const Project = require('../models/Project');
const FileModel = require('../models/File');
const storage = require('../services/storage');
const puppeteer = require('puppeteer');

contractQueue.process(async (job) => {
  const { jobId, projectId, options } = job.data;
  console.log('Processing contract job', jobId);
  const cj = await ContractJob.findById(jobId);
  if (!cj) throw new Error('ContractJob not found');
  try {
    cj.status = 'processing';
    await cj.save();

    const project = await Project.findById(projectId).lean();
    if (!project) throw new Error('Project not found');

    // Render basic HTML for PDF. In production use template engine.
    const html = `<html><body><h1>${project.title}</h1><p>Code: ${project.code}</p></body></html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const filename = `contract-${project.code || projectId}.pdf`;
    const key = `contracts/${projectId}/${Date.now()}_${filename}`;
    await storage.uploadFromBuffer(key, pdfBuffer, 'application/pdf');

    cj.status = 'done';
    cj.outputKey = key;
    await cj.save();

    await FileModel.create({ projectId, key, name: filename, size: pdfBuffer.length, mimeType: 'application/pdf' });
    return Promise.resolve();
  } catch (err) {
    console.error('Contract job failed', err);
    cj.status = 'failed';
    cj.error = err.message;
    await cj.save();
    throw err;
  }
});

console.log('Contract worker started');
