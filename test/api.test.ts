import { beforeEach, describe, expect, it } from 'vitest';

import { DirectusAPI } from '../src/api/directus.js';

describe('DirectusAPI', () => {
  let api: DirectusAPI;

  beforeEach(() => {
    api = new DirectusAPI();
  });

  it('should create instance', () => {
    expect(api).toBeDefined();
  });

  it('should configure client with url and token', () => {
    const url = 'https://test.directus.app';
    const token = 'test-token';
    
    expect(() => {
      api.configure(url, token);
    }).not.toThrow();
  });

  it('should throw error when client not configured', async () => {
    await expect(api.exportSchema()).rejects.toThrow('Client non configurato');
  });
});
