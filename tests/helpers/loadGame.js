const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const INDEX_HTML_PATH = path.join(__dirname, '..', '..', 'index.html');
const GAME_JS_PATH = path.join(__dirname, '..', '..', 'game.js');

const rawIndexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const gameSource = fs.readFileSync(GAME_JS_PATH, 'utf8');

// We only want the markup (the real ids/classes game.js expects). We inject
// game.js ourselves via window.eval, so any <script>/<link> tags from the
// original page are stripped to avoid jsdom trying to fetch Tailwind/Firebase/
// fonts from the network.
const bodyMatch = rawIndexHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) throw new Error('Could not find <body> in index.html');
const fixtureBodyHtml = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '');

// Web Audio isn't implemented by jsdom. game.js only reaches into it when a
// sound actually plays, so a minimal no-op stub is enough to keep any code
// path (muted or not) from crashing.
class FakeAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: '',
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  resume() {}
}

// A permissive default Firebase stub: present (so game.js doesn't enter its
// "retry until Firebase shows up" loop) but inert. Tests that care about
// leaderboard/session behavior pass their own `firebase` override.
function defaultFirebaseStub() {
  const inertRef = () => ({
    on: () => {},
    off: () => {},
    once: () => Promise.resolve({ val: () => null }),
    orderByChild: () => ({ limitToLast: () => ({ once: () => Promise.resolve({ val: () => null }) }) }),
    transaction: () => Promise.resolve({ committed: false, snapshot: null }),
    set: () => Promise.resolve(),
    remove: () => {},
    onDisconnect: () => ({ remove: () => {} }),
  });

  const database = () => ({ ref: inertRef });
  database.ServerValue = { TIMESTAMP: 'TIMESTAMP' };

  return { database };
}

/**
 * Loads a fresh copy of game.js into its own isolated jsdom window (so each
 * test gets its own realm - top-level `let`/`const` in game.js can't be
 * re-declared into a shared global, which is what a second `eval()` into the
 * same window would do).
 */
function loadGame({ firebase = defaultFirebaseStub(), muted = true, innerWidth = 1024, innerHeight = 768 } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>${fixtureBodyHtml}</body></html>`, {
    url: 'https://ragna-memories.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    // game.js logs verbosely (Firebase session tracking, retries, etc.) -
    // an unconnected VirtualConsole keeps that out of test output without
    // touching game.js itself.
    virtualConsole: new VirtualConsole(),
  });
  const { window } = dom;

  Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });

  window.AudioContext = FakeAudioContext;

  if (muted) {
    window.localStorage.setItem('ragna-muted', 'true');
  }

  if (firebase) {
    window.firebaseInitialized = true;
    window.firebase = firebase;
  }

  // game.js schedules real timers as a side effect of loading (the 600ms
  // flip-check delay, the 1s game clock, Firebase's "retry init" backoff,
  // and a 30-minute session-expiry timeout). Tests drive those flows
  // synchronously/manually instead, and jsdom dispatches DOMContentLoaded
  // asynchronously even for a same-string-constructed document, so this has
  // to be in place *before* eval - not patched in afterward.
  window.setTimeout = () => 0;
  window.setInterval = () => 0;
  window.clearTimeout = () => {};
  window.clearInterval = () => {};

  window.eval(gameSource);

  return dom;
}

module.exports = { loadGame, defaultFirebaseStub, FakeAudioContext };
