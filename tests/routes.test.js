const request = require('supertest');
const { app } = require('../server');

describe('API Routes', () => {
  describe('GET /', () => {
    it('should return server running message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toEqual('MCP Server đang chạy');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const routes = [
        '/api/documents',
        '/api/spreadsheets',
        '/api/presentations'
      ];

      for (const route of routes) {
        const res = await request(app).get(route);
        expect(res.statusCode).toEqual(401);
      }
    });
  });
});