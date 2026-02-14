import request from 'supertest';
import app from '../src/index.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

describe('Smoke API tests', function () {
  it('GET /api/login (vista) -> 200 {ok:true}', async () => {
    const res = await request(app).get('/api/login').expect('Content-Type', /json/).expect(200);
    if (!res.body || res.body.ok !== true) throw new Error('Expected { ok:true }');
  });

  it('POST /api/login missing fields -> 400 or 401', async () => {
    const res = await request(app).post('/api/login').send({}).expect('Content-Type', /json/);
    if (![400, 401].includes(res.status)) throw new Error('Expected 400 or 401 for missing/invalid credentials');
  });

  it('GET /api/admin-panel without token -> 401', async () => {
    await request(app).get('/api/admin-panel').expect(401);
  });

  it('GET /api/admin-panel with user token -> 403', async () => {
    const token = jwt.sign({ id: 99999, rol: 'user', email: 'x@x.com', name: 'X' }, config.jwtSecret);
    await request(app).get('/api/admin-panel').set('Authorization', `Bearer ${token}`).expect(403);
  });
});
