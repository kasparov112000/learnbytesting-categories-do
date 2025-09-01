import { expect } from 'chai';

// Simple mock for Express
const mockRouter = {
  get: jest.fn(),
  route: jest.fn().mockReturnThis()
};

// Create a proper mock for Express with Router property
const expressMock = {
  Router: jest.fn().mockReturnValue(mockRouter)
};

// Mock the express module
jest.mock('express', () => {
  return jest.fn().mockReturnValue({
    use: jest.fn(),
    get: jest.fn()
  });
});

describe('Healthcheck API', () => {
  it('should have router defined', () => {
    const app = require('express')();
    const router = require('../../routes/healthcheck.api').default(app, expressMock);
    expect(router).to.exist;
  });
});
