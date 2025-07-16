// __tests__/simple.test.ts
describe('Simple Test Suite', () => {
  it('should always pass', () => {
    expect(true).toBe(true);
  });

  it('should verify basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify string concatenation', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });
});
