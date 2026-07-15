const monsterImages = [
    'imgs/angeling.png',
    'imgs/chimera.png',
    'imgs/choco.png',
    'imgs/deviling.png',
    'imgs/eddga.png',
    'imgs/ghostring.png',
    'imgs/toad.png',
    'imgs/vocal.png',
    'imgs/atroce.png',
    'imgs/maya.png',
    'imgs/mistress.png',
    'imgs/moonlight.png',
    'imgs/osiris.png',
    'imgs/pharaoh.png',
    'imgs/ungoliant.png',
    'imgs/doppelganger.png',
    'imgs/dracula.png',
    'imgs/drake.png',
    'imgs/argos.png',
    'imgs/ambernite.png',
    'imgs/andre.png',
    'imgs/ant_egg.png',
    'imgs/bigfoot.png',
    'imgs/boa.png',
    'imgs/chonchon.png',
    'imgs/creamy.png',
    'imgs/drops.png',
    'imgs/fabre.png',
    'imgs/honet.png',
    'imgs/hydra.png',
    'imgs/lunatic.png',
    'imgs/mandragora.png',
    'imgs/pecopeco_egg.png',
    'imgs/poporing.png',
    'imgs/poring.png',
    'imgs/pupa.png',
    'imgs/roda_frog.png',
    'imgs/santa_poring.png',
    'imgs/smokie.png',
    'imgs/spore.png',
    'imgs/steel_chonchon.png',
    'imgs/thief_bug_egg.png',
    'imgs/vadon.png',
    'imgs/zombie.png'
];

let flippedCards = [];
let matches = 0;
let totalPairs = 0;
let movesLeft = 0;
let maxMoves = 0;
let currentDiff = '';

// Scoring
let score = 0;
let combo = 0;
let bestCombo = 0;
const POINTS_PER_MATCH = 100;

// Timer Variables
let secondsElapsed = 0;
let timerInterval = null;

// Sound System (synthesized via Web Audio API — no external assets needed)
let audioCtx = null;
let isMuted = localStorage.getItem('ragna-muted') === 'true';

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, duration, type = 'square', delay = 0, volume = 0.15) {
    if (isMuted) return;
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
}

function playFlipSound() {
    playTone(440, 0.08, 'square', 0, 0.08);
}

function playMatchSound() {
    playTone(660, 0.1, 'square', 0, 0.12);
    playTone(880, 0.15, 'square', 0.1, 0.12);
}

function playMismatchSound() {
    playTone(180, 0.25, 'sawtooth', 0, 0.1);
}

function playVictorySound() {
    [523, 659, 784, 1047].forEach((freq, i) => playTone(freq, 0.18, 'square', i * 0.12, 0.13));
}

function playDefeatSound() {
    [392, 349, 311, 262].forEach((freq, i) => playTone(freq, 0.25, 'sawtooth', i * 0.15, 0.1));
}

function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem('ragna-muted', isMuted);
    updateSoundToggleUI();
    if (!isMuted) playFlipSound();
}

const SOUND_ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SOUND_ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>';

function updateSoundToggleUI() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    const label = isMuted ? 'Sound: Off' : 'Sound: On';
    btn.innerHTML = isMuted ? SOUND_ICON_OFF : SOUND_ICON_ON;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
}

function setDiff(name, count, moves) {
    currentDiff = name;
    totalPairs = count / 2;
    movesLeft = moves;
    maxMoves = moves;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('bg-amber-900/40', 'border-amber-300'));
    event.currentTarget.classList.add('bg-amber-900/40', 'border-amber-300');
}

// Best score/time per rank (persisted in localStorage)
const RANK_NAMES = ['Novice', 'Swordsman', 'Knight', 'Lord Knight'];

function rankSlug(rank) {
    return rank.replace(/\s+/g, '-').toLowerCase();
}

function bestStorageKey(rank) {
    return `ragna-best-${rankSlug(rank)}`;
}

function getBest(rank) {
    try {
        const raw = localStorage.getItem(bestStorageKey(rank));
        return raw ? JSON.parse(raw) : { score: 0, time: null };
    } catch {
        return { score: 0, time: null };
    }
}

function updateBestOnVictory(rank, finalScore, finalTime) {
    const best = getBest(rank);
    const newBestScore = finalScore > best.score;
    const newBestTime = best.time === null || finalTime < best.time;

    if (newBestScore) best.score = finalScore;
    if (newBestTime) best.time = finalTime;
    localStorage.setItem(bestStorageKey(rank), JSON.stringify(best));

    return { best, newBestScore, newBestTime };
}

function renderBestLabels() {
    RANK_NAMES.forEach(rank => {
        const el = document.querySelector(`[data-best-for="${rank}"]`);
        if (!el) return;
        const best = getBest(rank);
        el.textContent = best.score > 0 ? `Best: ${best.score} pts · ${best.time}s` : 'Best: —';
    });
}

// ========== FIREBASE GLOBAL LEADERBOARD ==========

function sanitizeNicknameKey(nickname) {
    return nickname.trim().toLowerCase().replace(/[.#$\[\]/]/g, '_') || 'adventurer';
}

function submitScoreToLeaderboard(rank, nickname, finalScore, finalTime) {
    if (!window.firebaseInitialized || !window.firebase) return;

    try {
        const db = firebase.database();
        const nicknameKey = sanitizeNicknameKey(nickname);
        db.ref(`scores/${rankSlug(rank)}/${nicknameKey}`).set({
            nickname,
            score: finalScore,
            time: finalTime,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).catch((error) => console.error('Error submitting score:', error));
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

function fetchLeaderboard(rank) {
    if (!window.firebaseInitialized || !window.firebase) return Promise.resolve([]);

    const db = firebase.database();
    return db.ref(`scores/${rankSlug(rank)}`)
        .orderByChild('score')
        .limitToLast(10)
        .once('value')
        .then((snapshot) => {
            const entries = snapshot.val() || {};
            return Object.values(entries).sort((a, b) => b.score - a.score);
        })
        .catch((error) => {
            console.error('Error fetching leaderboard:', error);
            return [];
        });
}

function renderLeaderboard(rank) {
    const rowsEl = document.getElementById('leaderboard-rows');
    const emptyEl = document.getElementById('leaderboard-empty');
    if (!rowsEl) return;

    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.toggle('leaderboard-tab-active', tab.dataset.rank === rank);
    });

    rowsEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.add('hidden');

    fetchLeaderboard(rank).then((entries) => {
        if (entries.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        rowsEl.innerHTML = entries.map((entry, i) => `
            <tr class="border-b border-[rgba(201,162,39,0.2)]">
                <td class="py-1.5 pr-2 text-[var(--parchment-dim)]">${i + 1}</td>
                <td class="py-1.5 pr-2 text-[var(--parchment)] truncate max-w-[8rem]">${entry.nickname}</td>
                <td class="py-1.5 pr-2 text-[var(--gold-bright)] font-bold text-right">${entry.score}</td>
                <td class="py-1.5 text-[var(--parchment-dim)] text-right">${entry.time}s</td>
            </tr>
        `).join('');
    });
}

function openLeaderboard() {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    renderLeaderboard(currentDiff || 'Novice');
}

function closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
}

function startTimer() {
    secondsElapsed = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        document.getElementById('ui-timer').innerText = secondsElapsed + 's';
    }, 1000);
}

function startGame() {
    const name = document.getElementById('nickname').value.trim().slice(0, 20) || 'ADVENTURER';
    localStorage.setItem('ragna-nickname', name);
    if (!currentDiff) {
        showModal({
            title: 'Hold, Adventurer!',
            message: 'Choose your path first — pick a rank before beginning your quest.',
            buttonText: 'Understood'
        });
        return;
    }

    document.getElementById('setup-modal').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');

    document.getElementById('ui-name').innerText = name;
    document.getElementById('ui-diff').innerText = currentDiff;

    score = 0;
    combo = 0;
    bestCombo = 0;

    updateUI();
    initGrid();
    startTimer(); // Start the clock
}

function initGrid() {
    const grid = document.getElementById('game-grid');
    const isMobile = window.innerWidth < 768;

    // Define Grid Layout based on difficulty
    let cols, rows;
    if (currentDiff === 'Novice') {
        cols = isMobile ? 3 : 4;
        rows = Math.ceil((totalPairs * 2) / cols);
    } else if (currentDiff === 'Swordsman') {
        cols = isMobile ? 4 : 4;
        rows = Math.ceil((totalPairs * 2) / cols);
    } else if (currentDiff === 'Knight') {
        cols = isMobile ? 4 : 6; // Knight uses 6 cols on desktop
        rows = Math.ceil((totalPairs * 2) / cols);
    } else { // Lord Knight
        cols = isMobile ? 6 : 9;
        rows = Math.ceil((totalPairs * 2) / cols);
    }

    // Apply the column count
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    // DYNAMIC HEIGHT CALCULATION
    // We calculate exactly how tall a card can be to fit the remaining space
    const availableHeight = window.innerHeight - 200; // Header + Footer space
    const paddingAndGaps = (rows + 1) * 10; // 10px gap between cards
    const maxCardHeight = Math.floor((availableHeight - paddingAndGaps) / rows);

    const selectedImgs = [...monsterImages].sort(() => Math.random() - 0.5).slice(0, totalPairs);
    const gameDeck = [...selectedImgs, ...selectedImgs].sort(() => Math.random() - 0.5);

    grid.innerHTML = '';
    gameDeck.forEach((imgUrl) => {
        const card = document.createElement('div');
        card.className = 'memory-card';

        // This is the fix: the card height is limited by the rows in play
        card.style.maxHeight = `${maxCardHeight}px`;
        card.style.maxWidth = `${Math.floor(maxCardHeight * 0.66)}px`; // Keep 2:3 ratio

        card.innerHTML = `
            <div class="card-inner" onclick="flipCard(this, '${imgUrl}')">
                <div class="card-back rounded-lg overflow-hidden">
                    <div class="gem-socket">
                        <div class="gem-ring"></div>
                        <div class="gem"></div>
                    </div>
                </div>
                <div class="card-front rounded-lg border-2 border-[var(--gold)] overflow-hidden">
                    <img src="${imgUrl}" class="w-full h-full object-cover">
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

updateSoundToggleUI();
renderBestLabels();

const savedNickname = localStorage.getItem('ragna-nickname');
if (savedNickname) document.getElementById('nickname').value = savedNickname;

// Add this to handle screen rotation or resizing
window.addEventListener('resize', () => {
    if (!document.getElementById('game-ui').classList.contains('hidden')) {
        initGrid();
    }
});

function flipCard(cardEl, img) {
    if (flippedCards.length < 2 && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
        playFlipSound();
        flippedCards.push({ el: cardEl, img: img });

        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 600);
        }
    }
}

function checkMatch() {
    const [c1, c2] = flippedCards;
    const isMatch = c1.img === c2.img;

    if (isMatch) {
        matches++;
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        const gained = POINTS_PER_MATCH * combo;
        score += gained;
        showComboPopup(combo >= 2 ? `COMBO x${combo}! +${gained}` : `+${gained}`);
        playMatchSound();

        // STABILITY FIX: We add a class but don't change the scale/filter of the parent
        c1.el.classList.add('matched-card');
        c2.el.classList.add('matched-card');
        // Change border to emerald to indicate success
        c1.el.querySelector('.card-front').style.borderColor = '#2f5233';
        c2.el.querySelector('.card-front').style.borderColor = '#2f5233';
    } else {
        movesLeft--;
        if (combo >= 2) showComboPopup('COMBO BROKEN', 'break');
        combo = 0;
        playMismatchSound();
        c1.el.classList.remove('flipped');
        c2.el.classList.remove('flipped');
    }

    flippedCards = [];
    updateUI();
    if (isMatch) pulseScore();
    checkGameOver();
}

function showComboPopup(text, variant = 'combo') {
    const el = document.getElementById('combo-popup');
    el.textContent = text;
    el.classList.remove('show', 'combo-break');
    if (variant === 'break') el.classList.add('combo-break');
    void el.offsetWidth; // restart animation
    el.classList.add('show');
}

function pulseScore() {
    const scoreEl = document.getElementById('ui-score');
    scoreEl.classList.remove('pulse');
    void scoreEl.offsetWidth; // restart animation
    scoreEl.classList.add('pulse');
}

function updateUI() {
    document.getElementById('ui-matches').innerText = `${matches} / ${totalPairs}`;
    document.getElementById('ui-moves').innerText = movesLeft;
    document.getElementById('ui-score').innerText = score;
    const percentage = (movesLeft / maxMoves) * 100;
    const bar = document.getElementById('stamina-bar');
    bar.style.width = percentage + '%';

    if (percentage < 25) bar.style.backgroundColor = '#7a1620';
    else if (percentage < 50) bar.style.backgroundColor = '#c9a227';
}

function showModal({ title, stats = [], message = '', buttonText = 'Continue', onConfirm, variant = 'default' }) {
    const titleEl = document.getElementById('modal-title');
    titleEl.innerText = title;
    titleEl.style.color = variant === 'defeat' ? 'var(--burgundy-bright)' : 'var(--gold-bright)';

    const messageHtml = message ? `<p class="text-[var(--parchment)] mb-4">${message}</p>` : '';
    const statsHtml = stats.map(s => `
        <div class="flex justify-between items-center text-sm border-b border-[rgba(201,162,39,0.2)] py-1.5">
            <span class="label-caps text-[var(--parchment-dim)] uppercase text-xs">${s.label}</span>
            <span class="font-bold stat-digits text-sm text-[var(--gold-bright)]">${s.value}</span>
        </div>
    `).join('');
    document.getElementById('modal-body').innerHTML = messageHtml + statsHtml;

    const btn = document.getElementById('modal-btn');
    btn.innerText = buttonText;
    btn.onclick = () => {
        document.getElementById('result-modal').classList.add('hidden');
        if (onConfirm) onConfirm();
    };

    document.getElementById('result-modal').classList.remove('hidden');
}

function checkGameOver() {
    if (matches === totalPairs) {
        clearInterval(timerInterval);
        playVictorySound();
        const { newBestScore, newBestTime } = updateBestOnVictory(currentDiff, score, secondsElapsed);
        if (newBestScore || newBestTime) {
            const nickname = document.getElementById('ui-name')?.innerText || 'Adventurer';
            submitScoreToLeaderboard(currentDiff, nickname, score, secondsElapsed);
        }
        showModal({
            title: 'Quest Complete!',
            message: (newBestScore || newBestTime)
                ? '<span class="text-[var(--gold-bright)] font-bold uppercase tracking-widest">New Best!</span>'
                : '',
            stats: [
                { label: 'Time', value: `${secondsElapsed}s` },
                { label: 'Moves Left', value: movesLeft },
                { label: 'Score', value: score },
                { label: 'Best Combo', value: `x${bestCombo}` },
            ],
            buttonText: 'Return to Town',
            onConfirm: () => location.reload()
        });
    } else if (movesLeft <= 0) {
        clearInterval(timerInterval);
        playDefeatSound();
        showModal({
            title: 'You Have Been Defeated',
            message: 'No moves remain — return to a save point.',
            stats: [{ label: 'Score', value: score }],
            buttonText: 'Return to Town',
            onConfirm: () => location.reload(),
            variant: 'defeat'
        });
    }
}

// ========== FIREBASE PLAYER COUNT TRACKING ==========

let currentSessionId = null;
let playerCountListener = null;
let playerCountInitAttempts = 0;

/**
 * Generates a unique session ID for this player
 */
function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize Firebase player count tracking
 * Listens to the active sessions in the database and updates the UI
 */
function initPlayerCountTracking() {
    if (!window.firebaseInitialized || !window.firebase) {
        playerCountInitAttempts++;
        if (playerCountInitAttempts <= 20) {
            console.log('Firebase not ready yet, retrying player count init...', playerCountInitAttempts);
            setTimeout(initPlayerCountTracking, 200);
            return;
        }

        console.error('Firebase player count tracking could not initialize after retries.');
        return;
    }

    try {
        const db = firebase.database();

        console.log('Firebase player count tracking initialized');

        // Listener for real-time player count updates
        playerCountListener = db.ref('activeSessions').on('value', (snapshot) => {
            const sessions = snapshot.val() || {};
            const cutoff = Date.now() - 30 * 60 * 1000;
            const playerCount = Object.values(sessions).filter((session) => session.joinedAt >= cutoff).length;
            console.log('Player count updated:', playerCount);
            updatePlayerCountUI(playerCount);
        }, (error) => {
            console.error('Error reading player count:', error);
        });
    } catch (error) {
        console.error('Firebase player count tracking error:', error);
    }
}

/**
 * Add current player's session to Firebase
 */
function startPlayerSession() {
    if (!window.firebaseInitialized || !window.firebase) {
        console.warn('Cannot start player session: Firebase unavailable');
        return;
    }

    try {
        const db = firebase.database();
        currentSessionId = generateSessionId();

        const sessionData = {
            sessionId: currentSessionId,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            adventurer: document.getElementById('ui-name')?.innerText || 'Adventurer',
            rank: currentDiff || 'Unknown'
        };

        console.log('Starting player session:', sessionData);

        const sessionRef = db.ref(`activeSessions/${currentSessionId}`);

        // Server-side cleanup: removes this session as soon as Firebase detects
        // the connection dropped (crash, force-quit, lost network, etc.), unlike
        // beforeunload/unload which don't reliably fire in those cases.
        sessionRef.onDisconnect().remove();

        // Add this session to the database
        sessionRef.set(sessionData)
            .then(() => console.log('Player session saved:', currentSessionId))
            .catch((error) => console.error('Error saving player session:', error));

        // Auto-remove after 30 minutes of inactivity (safety measure)
        setTimeout(() => {
            if (currentSessionId) {
                endPlayerSession();
            }
        }, 30 * 60 * 1000);
    } catch (error) {
        console.error('Error starting player session:', error);
    }
}

/**
 * Remove current player's session from Firebase
 */
function endPlayerSession() {
    if (!window.firebaseInitialized || !window.firebase || !currentSessionId) {
        return;
    }

    try {
        const db = firebase.database();
        db.ref(`activeSessions/${currentSessionId}`).remove();
        currentSessionId = null;
    } catch (error) {
        console.error('Error ending player session:', error);
    }
}

/**
 * Update the player count UI elements
 */
function updatePlayerCountUI(count) {
    // Update setup modal player count
    const setupCountEl = document.getElementById('setup-player-count');
    const setupNumberEl = document.getElementById('setup-player-number');
    if (setupCountEl && setupNumberEl) {
        // Don't toggle visibility — keep placeholder visible by default.
        setupNumberEl.innerText = count;
        setupNumberEl.classList.remove('placeholder');
    }

    // Update game UI player count
    const gameCountEl = document.getElementById('game-player-count');
    const gameNumberEl = document.getElementById('game-player-number');
    if (gameCountEl && gameNumberEl) {
        // Keep container visible; just update the number and remove placeholder styling.
        gameNumberEl.innerText = count;
        gameNumberEl.classList.remove('placeholder');
    }
}

/**
 * Clean up Firebase listeners and sessions when page unloads
 */
function cleanupFirebase() {
    if (playerCountListener && window.firebaseInitialized && window.firebase) {
        try {
            firebase.database().ref('activeSessions').off('value', playerCountListener);
        } catch (error) {
            console.error('Error removing Firebase listener:', error);
        }
    }
    endPlayerSession();
}

// Initialize player count tracking when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayerCountTracking);
} else {
    initPlayerCountTracking();
}

// Hook into startGame to begin a player session
const originalStartGame = startGame;
startGame = function() {
    originalStartGame.call(this);
    startPlayerSession();
};

// Clean up when page unloads
window.addEventListener('beforeunload', cleanupFirebase);
window.addEventListener('unload', cleanupFirebase);
