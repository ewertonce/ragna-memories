const { loadGame } = require('./helpers/loadGame');

test('game.js loads into an isolated window and exposes its top-level functions', () => {
  const { window } = loadGame();

  expect(typeof window.sanitizeNicknameKey).toBe('function');
  expect(typeof window.getBest).toBe('function');
  expect(typeof window.flipCard).toBe('function');
  expect(typeof window.checkMatch).toBe('function');
  expect(window.document.getElementById('game-grid')).not.toBeNull();
});
