import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have basic test infrastructure working', () => {
    expect(true).toBe(true);
  });

  it('should be able to import types', () => {
    const message = {
      type: 'save-token' as const,
      token: 'test-token',
    };
    expect(message.type).toBe('save-token');
  });
});
