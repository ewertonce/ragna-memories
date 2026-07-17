const { loadGame } = require('./helpers/loadGame');

describe('sanitizeNicknameKey', () => {
  test('lowercases and trims surrounding whitespace', () => {
    const { window } = loadGame();
    expect(window.sanitizeNicknameKey('  Darian  ')).toBe('darian');
  });

  test('replaces Firebase Realtime Database path-breaking characters with underscores', () => {
    const { window } = loadGame();
    // '.', '#', '$', '[', ']', '/' are illegal in Firebase RTDB keys.
    expect(window.sanitizeNicknameKey('a.b#c$d[e]f/g')).toBe('a_b_c_d_e_f_g');
  });

  test('falls back to "adventurer" for an empty or whitespace-only name', () => {
    const { window } = loadGame();
    expect(window.sanitizeNicknameKey('')).toBe('adventurer');
    expect(window.sanitizeNicknameKey('   ')).toBe('adventurer');
  });

  test('leaves an already-safe name untouched apart from casing', () => {
    const { window } = loadGame();
    expect(window.sanitizeNicknameKey('Knight_09')).toBe('knight_09');
  });
});
