const { loadGame } = require('./helpers/loadGame');

describe('rankSlug / bestStorageKey', () => {
  test('slugifies multi-word ranks with a hyphen, lowercased', () => {
    const { window } = loadGame();
    expect(window.rankSlug('Lord Knight')).toBe('lord-knight');
    expect(window.rankSlug('Novice')).toBe('novice');
  });

  test('storage key is rank-specific so different ranks never collide', () => {
    const { window } = loadGame();
    expect(window.bestStorageKey('Novice')).toBe('ragna-best-novice');
    expect(window.bestStorageKey('Lord Knight')).toBe('ragna-best-lord-knight');
  });
});

describe('getBest', () => {
  test('returns a zeroed record when nothing has been saved yet', () => {
    const { window } = loadGame();
    expect(window.getBest('Novice')).toEqual({ score: 0, time: null });
  });

  test('survives corrupted localStorage JSON instead of throwing', () => {
    const { window } = loadGame();
    window.localStorage.setItem('ragna-best-novice', 'not-json{');
    expect(window.getBest('Novice')).toEqual({ score: 0, time: null });
  });

  test('reads back a previously stored record', () => {
    const { window } = loadGame();
    window.localStorage.setItem('ragna-best-novice', JSON.stringify({ score: 500, time: 42 }));
    expect(window.getBest('Novice')).toEqual({ score: 500, time: 42 });
  });
});

describe('updateBestOnVictory', () => {
  test('the very first completed run always becomes the best, even with a low score', () => {
    const { window } = loadGame();
    const { best, isNewBest } = window.updateBestOnVictory('Novice', 0, 999);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ score: 0, time: 999 });
    expect(window.getBest('Novice')).toEqual({ score: 0, time: 999 });
  });

  test('a strictly higher score replaces the previous best', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 500, 60);
    const { isNewBest, best } = window.updateBestOnVictory('Novice', 800, 90);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ score: 800, time: 90 });
  });

  test('a lower score never overwrites the existing best', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 800, 60);
    const { isNewBest, best } = window.updateBestOnVictory('Novice', 500, 10);
    expect(isNewBest).toBe(false);
    expect(best).toEqual({ score: 800, time: 60 });
    expect(window.getBest('Novice')).toEqual({ score: 800, time: 60 });
  });

  test('equal score with a faster time counts as a new best', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 800, 60);
    const { isNewBest, best } = window.updateBestOnVictory('Novice', 800, 45);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ score: 800, time: 45 });
  });

  test('equal score with a slower (or equal) time does not overwrite', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 800, 60);
    const { isNewBest, best } = window.updateBestOnVictory('Novice', 800, 60);
    expect(isNewBest).toBe(false);
    expect(best).toEqual({ score: 800, time: 60 });
  });

  test('score and time are always replaced together, never mixed across separate runs', () => {
    // Regression test for the "local best score/time mixing results from
    // different games" bug: a high-score-but-slow run followed by a
    // low-score-but-fast run must NOT produce a Frankenstein best combining
    // the highest score ever seen with the fastest time ever seen.
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 900, 120); // best run: high score, slow time
    window.updateBestOnVictory('Novice', 200, 15); // separate run: low score, fast time

    expect(window.getBest('Novice')).toEqual({ score: 900, time: 120 });
  });

  test('different ranks track independent bests', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 300, 20);
    window.updateBestOnVictory('Lord Knight', 5000, 200);

    expect(window.getBest('Novice')).toEqual({ score: 300, time: 20 });
    expect(window.getBest('Lord Knight')).toEqual({ score: 5000, time: 200 });
  });
});

describe('renderBestLabels', () => {
  test('shows an em dash placeholder for ranks with no recorded best', () => {
    const { window } = loadGame();
    window.renderBestLabels();
    const el = window.document.querySelector('[data-best-for="Novice"]');
    expect(el.textContent).toBe('Best: —');
  });

  test('formats a saved best as "Best: <score> pts · <time>s"', () => {
    const { window } = loadGame();
    window.updateBestOnVictory('Novice', 1200, 88);
    window.renderBestLabels();
    const el = window.document.querySelector('[data-best-for="Novice"]');
    expect(el.textContent).toBe('Best: 1200 pts · 88s');
  });
});
