const FileModel = require('../models/File');
const storage = require('../services/storage');

async function presign(req, res) {
  try {
    const { projectId, filename, contentType, size } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });
    const { uploadUrl, key, expiresIn } = await storage.getPresignPutUrl({ projectId, filename, contentType, expires: 300 });
    return res.json({ uploadUrl, key, expiresIn });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generating presigned url' });
  }
}

async function complete(req, res) {
  try {
    const { projectId, key, name, size, mimeType, uploadedBy } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    const file = await FileModel.create({ projectId, key, name, size, mimeType, uploadedBy, uploadedAt: new Date() });
    return res.json(file);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error completing upload' });
  }
}

async function getFile(req, res) {
  try {
    const id = req.params.id;
    const file = await FileModel.findById(id).lean();
    if (!file) return res.status(404).json({ error: 'Not found' });
    const downloadUrl = await storage.getPresignGetUrl(file.key, 300);
    return res.json({ ...file, downloadUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching file' });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const file = await FileModel.findById(id);
    if (!file) return res.status(404).json({ error: 'Not found' });
    await storage.deleteObject(file.key);
    await file.remove();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error deleting file' });
  }
}

module.exports = { presign, complete, getFile, remove };
