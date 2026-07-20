const Activity = require('../models/Activity');

async function list(req, res) {
  try {
    const projectId = req.params.id;
    const items = await Activity.find({ projectId }).sort('-createdAt').lean();
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listing activities' });
  }
}

async function create(req, res) {
  try {
    const projectId = req.params.id;
    const body = req.body;
    body.projectId = projectId;
    const activity = await Activity.create(body);
    return res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creating activity' });
  }
}

module.exports = { list, create };
