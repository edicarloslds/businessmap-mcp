describe('validateConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when BUSINESSMAP_API_URL is an invalid URL', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'not-a-url';
    process.env['BUSINESSMAP_API_TOKEN'] = 'valid-token';

    const { validateConfig } = await import('./environment.js');
    expect(() => validateConfig()).toThrow('BUSINESSMAP_API_URL must be a valid URL');
  });

  it('throws when BUSINESSMAP_API_TOKEN is empty', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = '   ';

    const { validateConfig } = await import('./environment.js');
    expect(() => validateConfig()).toThrow('BUSINESSMAP_API_TOKEN cannot be empty');
  });

  it('passes validation with a valid URL and token', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = 'my-secret-token';

    const { validateConfig } = await import('./environment.js');
    expect(() => validateConfig()).not.toThrow();
  });

  it('parses ALLOWED_ORIGINS as a comma-separated list', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = 'token';
    process.env['ALLOWED_ORIGINS'] = 'https://app.example.com, https://dashboard.example.com';

    const { config } = await import('./environment.js');
    expect(config.server.allowedOrigins).toEqual([
      'https://app.example.com',
      'https://dashboard.example.com',
    ]);
  });

  it('defaults ALLOWED_ORIGINS to localhost when not set', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = 'token';
    delete process.env['ALLOWED_ORIGINS'];

    const { config } = await import('./environment.js');
    expect(config.server.allowedOrigins).toEqual(['http://localhost']);
  });

  it('parses ALLOWED_HOSTS as a comma-separated list', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = 'token';
    process.env['ALLOWED_HOSTS'] = 'mcp.example.com, localhost:3000';

    const { config } = await import('./environment.js');
    expect(config.server.allowedHosts).toEqual(['mcp.example.com', 'localhost:3000']);
  });

  it('maps TRANSPORT=sse to http for backwards compatibility', async () => {
    process.env['BUSINESSMAP_API_URL'] = 'https://example.businessmap.io';
    process.env['BUSINESSMAP_API_TOKEN'] = 'token';
    process.env['TRANSPORT'] = 'sse';

    const { config } = await import('./environment.js');
    expect(config.transport.type).toBe('http');
  });
});
