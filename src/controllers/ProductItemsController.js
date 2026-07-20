const ProductItem = require('../models/ProductItem');

async function addItem(req, res) {
  try {
    const projectId = req.params.id;
    const body = req.body;
    body.projectId = projectId;
    const item = await ProductItem.create(body);
    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error adding item' });
  }
}

async function patchItem(req, res) {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    const item = await ProductItem.findByIdAndUpdate(itemId, { $set: updates }, { new: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error updating item' });
  }
}

async function removeItem(req, res) {
  try {
    const { itemId } = req.params;
    const item = await ProductItem.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.remove();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error deleting item' });
  }
}

module.exports = { addItem, patchItem, removeItem };
