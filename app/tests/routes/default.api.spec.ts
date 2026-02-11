describe('Default API', () => {
  it('should have router defined', () => {
    const router = require('../../routes/default.api').default;
    expect(router).toBeDefined();
  });
});
