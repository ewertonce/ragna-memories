const { loadGame } = require('./helpers/loadGame');

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

function buildFirebaseStub({ transactionRef, fetchData } = {}) {
  const stub = {
    database: () => ({
      ref: (path) => {
        if (transactionRef) return transactionRef(path);
        return {
          orderByChild: () => ({
            limitToLast: () => ({
              once: () => Promise.resolve({ val: () => (fetchData !== undefined ? fetchData(path) : null) }),
            }),
          }),
        };
      },
    }),
  };
  stub.database.ServerValue = { TIMESTAMP: 'TIMESTAMP' };
  return stub;
}

describe('submitScoreToLeaderboard', () => {
  test('writes to a rank/nickname-scoped path derived from rankSlug + sanitizeNicknameKey', () => {
    let capturedPath = null;
    const firebase = buildFirebaseStub({
      transactionRef: (path) => {
        capturedPath = path;
        return { transaction: () => Promise.resolve() };
      },
    });
    const { window } = loadGame({ firebase });

    window.submitScoreToLeaderboard('Lord Knight', 'Sir.Test#Name', 500, 30);

    expect(capturedPath).toBe('scores/lord-knight/sir_test_name');
  });

  test('transaction accepts a new entry when no prior entry exists for that nickname', () => {
    let updateFn;
    const firebase = buildFirebaseStub({
      transactionRef: () => ({
        transaction: (fn) => {
          updateFn = fn;
          return Promise.resolve();
        },
      }),
    });
    const { window } = loadGame({ firebase });

    window.submitScoreToLeaderboard('Novice', 'Alice', 500, 30);

    expect(updateFn(null)).toEqual({
      nickname: 'Alice',
      score: 500,
      time: 30,
      updatedAt: 'TIMESTAMP',
    });
  });

  test('transaction accepts a strictly higher score than the existing remote entry', () => {
    let updateFn;
    const firebase = buildFirebaseStub({
      transactionRef: () => ({ transaction: (fn) => { updateFn = fn; return Promise.resolve(); } }),
    });
    const { window } = loadGame({ firebase });

    window.submitScoreToLeaderboard('Novice', 'Alice', 500, 30);

    expect(updateFn({ nickname: 'Alice', score: 300, time: 10 })).toMatchObject({ score: 500, time: 30 });
  });

  test('transaction accepts an equal score with a faster time', () => {
    let updateFn;
    const firebase = buildFirebaseStub({
      transactionRef: () => ({ transaction: (fn) => { updateFn = fn; return Promise.resolve(); } }),
    });
    const { window } = loadGame({ firebase });

    window.submitScoreToLeaderboard('Novice', 'Alice', 500, 20);

    expect(updateFn({ nickname: 'Alice', score: 500, time: 30 })).toMatchObject({ score: 500, time: 20 });
  });

  test('transaction aborts (returns undefined) when the remote entry is already as good or better', () => {
    let updateFn;
    const firebase = buildFirebaseStub({
      transactionRef: () => ({ transaction: (fn) => { updateFn = fn; return Promise.resolve(); } }),
    });
    const { window } = loadGame({ firebase });

    window.submitScoreToLeaderboard('Novice', 'Alice', 500, 30);

    expect(updateFn({ nickname: 'Alice', score: 900, time: 5 })).toBeUndefined();
    expect(updateFn({ nickname: 'Alice', score: 500, time: 30 })).toBeUndefined(); // tie, not faster
  });

  test('is a no-op when Firebase is unavailable', () => {
    const transaction = jest.fn();
    const firebase = buildFirebaseStub({ transactionRef: () => ({ transaction }) });
    const { window } = loadGame({ firebase });

    window.firebaseInitialized = false; // simulate Firebase going away after init
    window.submitScoreToLeaderboard('Novice', 'Alice', 500, 30);

    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('fetchLeaderboard', () => {
  test('sorts entries by score, descending', async () => {
    const firebase = buildFirebaseStub({
      fetchData: () => ({
        alice: { nickname: 'Alice', score: 300, time: 20 },
        bob: { nickname: 'Bob', score: 900, time: 15 },
        carol: { nickname: 'Carol', score: 500, time: 10 },
      }),
    });
    const { window } = loadGame({ firebase });

    const entries = await window.fetchLeaderboard('Novice');

    expect(entries.map((e) => e.nickname)).toEqual(['Bob', 'Carol', 'Alice']);
  });

  test('resolves to an empty array when there are no entries yet', async () => {
    const firebase = buildFirebaseStub({ fetchData: () => null });
    const { window } = loadGame({ firebase });

    await expect(window.fetchLeaderboard('Novice')).resolves.toEqual([]);
  });

  test('resolves to an empty array when Firebase is unavailable', async () => {
    const { window } = loadGame({ firebase: buildFirebaseStub() });
    window.firebaseInitialized = false;

    await expect(window.fetchLeaderboard('Novice')).resolves.toEqual([]);
  });

  test('swallows fetch errors and resolves to an empty array', async () => {
    const firebase = {
      database: () => ({
        ref: () => ({
          orderByChild: () => ({
            limitToLast: () => ({ once: () => Promise.reject(new Error('offline')) }),
          }),
        }),
      }),
    };
    firebase.database.ServerValue = { TIMESTAMP: 'TIMESTAMP' };
    const { window } = loadGame({ firebase });

    await expect(window.fetchLeaderboard('Novice')).resolves.toEqual([]);
  });
});

describe('renderLeaderboard', () => {
  test('renders one row per entry, highest score first, and activates the matching tab', async () => {
    const firebase = buildFirebaseStub({
      fetchData: () => ({
        bob: { nickname: 'Bob', score: 900, time: 15 },
        alice: { nickname: 'Alice', score: 300, time: 20 },
      }),
    });
    const { window } = loadGame({ firebase });

    window.renderLeaderboard('Novice');
    await flushMicrotasks();

    const rows = window.document.querySelectorAll('#leaderboard-rows tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Bob');
    expect(rows[0].textContent).toContain('900');
    expect(rows[1].textContent).toContain('Alice');

    const activeTab = window.document.querySelector('.leaderboard-tab-active');
    expect(activeTab.dataset.rank).toBe('Novice');
    expect(window.document.getElementById('leaderboard-loading').classList.contains('hidden')).toBe(true);
    expect(window.document.getElementById('leaderboard-empty').classList.contains('hidden')).toBe(true);
  });

  test('shows the empty state when a rank has no entries', async () => {
    const firebase = buildFirebaseStub({ fetchData: () => null });
    const { window } = loadGame({ firebase });

    window.renderLeaderboard('Lord Knight');
    await flushMicrotasks();

    expect(window.document.getElementById('leaderboard-empty').classList.contains('hidden')).toBe(false);
    expect(window.document.getElementById('leaderboard-rows').children.length).toBe(0);
  });
});
