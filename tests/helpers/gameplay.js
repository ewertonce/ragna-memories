// Shared helpers for driving game.js's card-matching flow deterministically.
// Note: loadGame() already neuters real timers, so flipCard's 600ms
// checkMatch delay never fires on its own - flipAndResolve() below triggers
// it manually instead.

/** Simulates picking a rank the way a real click on a .diff-btn would. */
function chooseDifficulty(window, name, count, moves) {
  const btn = window.document.querySelector(`.diff-btn`) || window.document.body;
  window.event = { currentTarget: btn };
  window.setDiff(name, count, moves);
  delete window.event;
}

function getCards(window) {
  return Array.from(window.document.querySelectorAll('.memory-card')).map((card) => ({
    inner: card.querySelector('.card-inner'),
    front: card.querySelector('.card-front'),
    img: card.querySelector('.card-front img').getAttribute('src'),
  }));
}

function findMatchingPair(cards) {
  const byImg = new Map();
  for (const c of cards) {
    if (!byImg.has(c.img)) byImg.set(c.img, []);
    byImg.get(c.img).push(c);
  }
  for (const group of byImg.values()) {
    if (group.length === 2) return group;
  }
  throw new Error('No matching pair found in dealt deck');
}

function findMismatchedPair(cards) {
  const first = cards[0];
  const other = cards.find((c) => c.img !== first.img);
  if (!other) throw new Error('Deck has only one distinct image, cannot mismatch');
  return [first, other];
}

/** Flips two cards and immediately (synchronously) resolves the match check,
 * mirroring what happens 600ms after a real second flip. */
function flipAndResolve(window, cardA, cardB) {
  window.flipCard(cardA.inner, cardA.img);
  window.flipCard(cardB.inner, cardB.img);
  window.checkMatch();
}

// game.js writes UI text via `.innerText` (not `.textContent`) - jsdom keeps
// the two independent. jsdom's innerText polyfill also stores whatever type
// is assigned (e.g. a raw number) instead of coercing to string as real
// browsers do, so we coerce here to match real-world behavior.
function text(window, id) {
  return String(window.document.getElementById(id).innerText);
}

module.exports = {
  chooseDifficulty,
  getCards,
  findMatchingPair,
  findMismatchedPair,
  flipAndResolve,
  text,
};
