const { loadGame } = require('./helpers/loadGame');

describe('generateSessionId', () => {
  test('matches the "session-<timestamp>-<random>" shape', () => {
    const { window } = loadGame();
    expect(window.generateSessionId()).toMatch(/^session-\d+-[a-z0-9]+$/);
  });

  test('produces unique ids across many calls', () => {
    const { window } = loadGame();
    const ids = new Set(Array.from({ length: 200 }, () => window.generateSessionId()));
    expect(ids.size).toBe(200);
  });
});
