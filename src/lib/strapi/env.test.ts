import { afterEach, describe, expect, it, vi } from 'vitest';

import { readStrapiEnv, strapiOrigin } from './env';

describe('strapiOrigin', () => {
  it('keeps a valid http(s) origin', () => {
    expect(strapiOrigin('https://cms.example.com')).toBe(
      'https://cms.example.com',
    );
    expect(strapiOrigin('https://cms.example.com/')).toBe(
      'https://cms.example.com',
    );
  });

  it('falls back when vercel pull left a [SENSITIVE] placeholder', () => {
    expect(strapiOrigin('[SENSITIVE]')).toBe('http://localhost:1337');
  });

  it('falls back for empty or non-url values', () => {
    expect(strapiOrigin('')).toBe('http://localhost:1337');
    expect(strapiOrigin('/')).toBe('http://localhost:1337');
    expect(strapiOrigin('not-a-url')).toBe('http://localhost:1337');
  });
});

describe('readStrapiEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips [SENSITIVE] and empty process.env values', () => {
    vi.stubEnv('STRAPI_URL', '[SENSITIVE]');
    expect(readStrapiEnv('STRAPI_URL')).toBeUndefined();
  });

  it('returns a real process.env value', () => {
    vi.stubEnv('STRAPI_URL', 'https://cms.example.com');
    expect(readStrapiEnv('STRAPI_URL')).toBe('https://cms.example.com');
  });
});
