const mongoose = require('mongoose');
const Proposal = require('../src/models/Proposal');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/backendm3d_seed';

const statuses = ['Em elaboração', 'Enviado', 'Negociação', 'Fechado', 'Perdido'];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seed() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO);

  // remove existing
  await Proposal.deleteMany({});

  const items = [];
  for (let i = 0; i < 25; i++) {
    const client = `Cliente ${i + 1}`;
    const project = `Projeto Exemplo ${i + 1}`;
    const services = [
      { id: 's1', label: 'Modelagem 3D', price: randInt(2000, 8000) },
      { id: 's2', label: 'Renderização', price: randInt(800, 3000) }
    ];
    const subtotal = services.reduce((s, it) => s + it.price, 0);
    const discount = i % 3 === 0 ? 0 : randInt(0, 500);
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal - discount + taxes;
    const code = `ORC-${String(2000 + i)}`;

    const doc = await Proposal.create({
      project_model: 'A',
      project_price: total,
      clientName: client,
      clientPhone: '555199999' + String(randInt(100, 999)),
      projectName: project,
      clientSource: 'site',
      project_services: services,
      productionDays: randInt(3, 20),
      currentDate: new Date().toISOString(),
      projectDeadline: `${randInt(5, 20)} dias`,
      user: undefined,
      pdfFileName: null,
      status: statuses[i % statuses.length],
      code
    });

    items.push(doc);
  }

  console.log('Seeded', items.length, 'proposals');
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
