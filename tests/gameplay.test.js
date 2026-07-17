const { loadGame } = require('./helpers/loadGame');
const {
  chooseDifficulty,
  getCards,
  findMatchingPair,
  findMismatchedPair,
  flipAndResolve,
  text,
} = require('./helpers/gameplay');

function startGameAt(window, name, count, moves) {
  chooseDifficulty(window, name, count, moves);
  window.startGame();
}

describe('difficulty setup', () => {
  test.each([
    ['Novice', 12, 12],
    ['Swordsman', 16, 17],
    ['Knight', 24, 26],
    ['Lord Knight', 36, 42],
  ])('%s deals %i cards and sets %i moves, matching index.html\'s buttons', (name, count, moves) => {
    const { window } = loadGame();
    startGameAt(window, name, count, moves);

    expect(window.document.querySelectorAll('.memory-card').length).toBe(count);
    expect(text(window, 'ui-diff')).toBe(name);
    expect(text(window, 'ui-moves')).toBe(String(moves));
    expect(text(window, 'ui-matches')).toBe(`0 / ${count / 2}`);
    window.close();
  });

  test('every dealt card has exactly one partner sharing its image', () => {
    const { window } = loadGame();
    startGameAt(window, 'Knight', 24, 26);

    const counts = new Map();
    for (const { img } of getCards(window)) {
      counts.set(img, (counts.get(img) || 0) + 1);
    }
    expect(counts.size).toBe(12);
    for (const count of counts.values()) expect(count).toBe(2);
    window.close();
  });

  test('refuses to start without a chosen rank', () => {
    const { window } = loadGame();
    window.startGame();

    // Setup modal stays up; the "choose a rank" nudge modal opens instead.
    expect(window.document.getElementById('setup-modal').classList.contains('hidden')).toBe(false);
    expect(window.document.getElementById('game-ui').classList.contains('hidden')).toBe(true);
    expect(window.document.getElementById('result-modal').classList.contains('hidden')).toBe(false);
    expect(text(window, 'modal-title')).toBe('Hold, Adventurer!');
    window.close();
  });
});

describe('matching a pair', () => {
  test('awards 100 points, records the match, and marks both cards matched', () => {
    const { window } = loadGame();
    startGameAt(window, 'Novice', 12, 12);

    const [a, b] = findMatchingPair(getCards(window));
    flipAndResolve(window, a, b);

    expect(text(window, 'ui-score')).toBe('100');
    expect(text(window, 'ui-matches')).toBe('1 / 6');
    expect(text(window, 'ui-moves')).toBe('12'); // a match never costs a move
    expect(a.inner.classList.contains('matched-card')).toBe(true);
    expect(b.inner.classList.contains('matched-card')).toBe(true);
    expect(a.front.style.borderColor).toBe('#2f5233');
    window.close();
  });

  test('consecutive matches scale with the combo multiplier (100, then 200)', () => {
    const { window } = loadGame();
    startGameAt(window, 'Knight', 24, 26);

    const cards = getCards(window);
    const [a, b] = findMatchingPair(cards);
    flipAndResolve(window, a, b);
    expect(text(window, 'ui-score')).toBe('100');

    const remaining = cards.filter((c) => c !== a && c !== b);
    const [c, d] = findMatchingPair(remaining);
    flipAndResolve(window, c, d);

    expect(text(window, 'ui-score')).toBe('300'); // 100 (combo x1) + 200 (combo x2)
    expect(text(window, 'ui-matches')).toBe('2 / 12');
    window.close();
  });
});

describe('mismatching a pair', () => {
  test('costs a move, leaves score untouched, and flips both cards back', () => {
    const { window } = loadGame();
    startGameAt(window, 'Novice', 12, 12);

    const [a, b] = findMismatchedPair(getCards(window));
    flipAndResolve(window, a, b);

    expect(text(window, 'ui-moves')).toBe('11');
    expect(text(window, 'ui-score')).toBe('0');
    expect(text(window, 'ui-matches')).toBe('0 / 6');
    expect(a.inner.classList.contains('flipped')).toBe(false);
    expect(b.inner.classList.contains('flipped')).toBe(false);
    window.close();
  });

  test('breaks an in-progress combo back down to zero', () => {
    const { window } = loadGame();
    startGameAt(window, 'Knight', 24, 26);

    const cards = getCards(window);
    const [a, b] = findMatchingPair(cards);
    flipAndResolve(window, a, b);
    const [c, d] = findMatchingPair(cards.filter((x) => x !== a && x !== b));
    flipAndResolve(window, c, d); // combo now x2

    const remaining = cards.filter((x) => ![a, b, c, d].includes(x));
    const [e, f] = findMismatchedPair(remaining);
    flipAndResolve(window, e, f);

    const popup = window.document.getElementById('combo-popup');
    expect(popup.textContent).toBe('COMBO BROKEN');
    expect(popup.classList.contains('combo-break')).toBe(true);

    // Combo reset means the next match is back to the base 100, not x3 (400 running total).
    const [g, h] = findMatchingPair(remaining.filter((x) => x !== e && x !== f));
    flipAndResolve(window, g, h);
    expect(text(window, 'ui-score')).toBe('400'); // 100 + 200 + 100
    window.close();
  });

  test('lowers the stamina bar color thresholds as moves run out', () => {
    const { window } = loadGame();
    startGameAt(window, 'Novice', 12, 10); // 10 moves total

    const cards = getCards(window);
    // Burn 6 moves via mismatches (leaves 4/10 = 40% -> amber zone).
    let pool = cards;
    for (let i = 0; i < 6; i++) {
      const [x, y] = findMismatchedPair(pool);
      flipAndResolve(window, x, y);
    }

    const bar = window.document.getElementById('stamina-bar');
    expect(bar.style.width).toBe('40%');
    expect(bar.style.backgroundColor).toBe('rgb(201, 162, 39)'); // #c9a227 amber, <50%
    window.close();
  });
});

describe('game over', () => {
  test('victory shows the result modal, saves a new best, and submits to the leaderboard', () => {
    const submitTransaction = jest.fn(() => Promise.resolve({ committed: true, snapshot: null }));
    const firebase = {
      database: () => ({
        ref: (path) => ({
          transaction: submitTransaction,
          on: () => {},
          off: () => {},
          once: () => Promise.resolve({ val: () => null }),
          orderByChild: () => ({ limitToLast: () => ({ once: () => Promise.resolve({ val: () => null }) }) }),
          set: () => Promise.resolve(),
          onDisconnect: () => ({ remove: () => {} }),
        }),
      }),
      database_ServerValue: { TIMESTAMP: 'TIMESTAMP' },
    };
    firebase.database.ServerValue = { TIMESTAMP: 'TIMESTAMP' };

    const { window } = loadGame({ firebase });
    // Tiny custom deck (2 pairs) so victory is reachable in two matches.
    startGameAt(window, 'Novice', 4, 10);

    const cards = getCards(window);
    const [a, b] = findMatchingPair(cards);
    flipAndResolve(window, a, b);
    const [c, d] = findMatchingPair(cards.filter((x) => x !== a && x !== b));
    flipAndResolve(window, c, d);

    expect(window.document.getElementById('result-modal').classList.contains('hidden')).toBe(false);
    expect(text(window, 'modal-title')).toBe('Quest Complete!');
    expect(window.getBest('Novice').score).toBe(300); // 100 + 200
    expect(submitTransaction).toHaveBeenCalledTimes(1);
    window.close();
  });

  test('running out of moves shows a defeat modal styled in burgundy', () => {
    const { window } = loadGame();
    startGameAt(window, 'Novice', 12, 1); // a single mismatch ends the run

    const [a, b] = findMismatchedPair(getCards(window));
    flipAndResolve(window, a, b);

    expect(window.document.getElementById('result-modal').classList.contains('hidden')).toBe(false);
    expect(text(window, 'modal-title')).toBe('You Have Been Defeated');
    // Defeat only reports Score (victory additionally reports Time/Moves Left/Best Combo).
    const statsLabels = Array.from(window.document.querySelectorAll('#modal-body .label-caps')).map((el) => el.textContent);
    expect(statsLabels).toEqual(['Score']);
    window.close();
  });
});
