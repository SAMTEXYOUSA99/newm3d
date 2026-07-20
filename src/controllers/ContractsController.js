const ContractJob = require('../models/ContractJob');
const contractQueue = require('../queues/contractQueue');

async function createContract(req, res) {
  try {
    const projectId = req.params.id;
    const options = req.body || {};
    const job = await ContractJob.create({ projectId, status: 'queued' });
    await contractQueue.add({ jobId: job._id.toString(), projectId, options });
    return res.json({ jobId: job._id.toString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creating contract job' });
  }
}

async function getStatus(req, res) {
  try {
    const jobId = req.params.jobId;
    const job = await ContractJob.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: 'Not found' });
    return res.json({ status: job.status, outputKey: job.outputKey, error: job.error });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching job status' });
  }
}

module.exports = { createContract, getStatus };
