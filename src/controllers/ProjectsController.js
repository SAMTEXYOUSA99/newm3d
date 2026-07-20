const Project = require('../models/Project');
const ProductItem = require('../models/ProductItem');
const File = require('../models/File');
const Activity = require('../models/Activity');

async function list(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage) || 12);
    const status = req.query.status;
    const q = req.query.q;
    const sort = req.query.sort || '-createdAt';

    const filter = {};
    if (status && status !== 'Todos') filter.status = status;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const total = await Project.countDocuments(filter);
    const items = await Project.find(filter).sort(sort).skip((page - 1) * perPage).limit(perPage).lean();
    return res.json({ items, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listing projects' });
  }
}

async function create(req, res) {
  try {
    const body = req.body;
    if (!body.code || !body.title) return res.status(400).json({ error: 'code and title required' });
    const project = await Project.create(body);
    return res.status(201).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creating project' });
  }
}

async function get(req, res) {
  try {
    const id = req.params.id;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ error: 'Not found' });
    const items = await ProductItem.find({ projectId: id }).sort('position').lean();
    const files = await File.find({ projectId: id }).lean();
    const activities = await Activity.find({ projectId: id }).sort('-createdAt').lean();
    return res.json({ ...project, items, files, activities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching project' });
  }
}

async function patch(req, res) {
  try {
    const id = req.params.id;
    const updates = req.body;
    const project = await Project.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!project) return res.status(404).json({ error: 'Not found' });
    return res.json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error updating project' });
  }
}

async function autosave(req, res) {
  try {
    const id = req.params.id;
    const updates = req.body;
    const project = await Project.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!project) return res.status(404).json({ error: 'Not found' });
    return res.json({ savedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error autosaving project' });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    await ProductItem.deleteMany({ projectId: id });
    await File.deleteMany({ projectId: id });
    await Activity.deleteMany({ projectId: id });
    await project.remove();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error deleting project' });
  }
}

module.exports = { list, create, get, patch, autosave, remove };
