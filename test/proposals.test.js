const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const Proposal = require('../src/models/Proposal');

const MONGO = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/backendm3d_test';

beforeAll(async () => {
  await mongoose.connect(MONGO);
  await Proposal.deleteMany({});

  // seed small set
  const docs = [];
  for (let i = 0; i < 15; i++) {
    docs.push({
      project_model: 'A',
      project_price: 1000 + i * 100,
      clientName: `Client ${i}`,
      projectName: `Project ${i}`,
      project_services: [{ id: 's1', label: 'Service', price: 1000 + i * 100 }],
      productionDays: 5,
      currentDate: new Date().toISOString(),
      projectDeadline: '2026-09-15',
      status: i % 2 === 0 ? 'Em elaboração' : 'Enviado',
      code: `ORC-TEST-${i}`
    });
  }
  await Proposal.insertMany(docs);
});

afterAll(async () => {
  await mongoose.disconnect();
});

test('GET /proposals returns paginated list', async () => {
  const res = await request(app).get('/proposals?page=1&perPage=10');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('items');
  expect(Array.isArray(res.body.items)).toBe(true);
  expect(res.body).toHaveProperty('total');
  expect(res.body.total).toBeGreaterThanOrEqual(15);
  expect(res.body.items[0]).toHaveProperty('projectDeadline');
  expect(res.body.items[0]).toHaveProperty('productionDays');
});

test('GET /proposals/:id returns detail or 404', async () => {
  const resList = await request(app).get('/proposals?q=Project%200');
  expect(resList.statusCode).toBe(200);
  const item = resList.body.items && resList.body.items[0];
  expect(item).toBeDefined();

  const id = item.id;
  const res = await request(app).get(`/proposals/${id}`);
  expect([200, 404]).toContain(res.statusCode);
  if (res.statusCode === 200) {
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('client');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('projectDeadline', '2026-09-15');
    expect(res.body).toHaveProperty('productionDays', 5);
  }
});
