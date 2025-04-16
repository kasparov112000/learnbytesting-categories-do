import { expect } from 'chai';
import express from 'express';
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn()
  };
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn()
  }));
  mockExpress.Router = jest.fn(() => mockRouter);
  return mockExpress;
});

describe('Healthcheck API', () => {
  it('should have router defined', () => {
    const app = express();
    const router = require('../../routes/healthcheck.api').default(app);
    expect(router).to.exist;
  });
});
