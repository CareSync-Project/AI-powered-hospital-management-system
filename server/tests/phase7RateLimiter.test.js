import express from 'express';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { symptomRateLimiter } from '../src/middleware/symptomRateLimiter.js';

describe('Phase 7 assessment abuse protection', () => {
  test('rate limiter permits normal use then returns 429 for excessive submissions', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.post('/assessment', symptomRateLimiter, (_req, res) => res.status(201).json({ success: true }));
    const agent = request(app);
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await agent.post('/assessment').set('X-Forwarded-For', '198.51.100.77');
      expect(response.status).toBe(201);
    }
    const blocked = await agent.post('/assessment').set('X-Forwarded-For', '198.51.100.77');
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/too many symptom assessment requests/i);
  });
});
