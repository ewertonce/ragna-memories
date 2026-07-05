const monsterImages = [
    'imgs/img1.png',
    'imgs/img2.png',
    'imgs/img3.png',
    'imgs/img4.png',
    'imgs/img5.png',
    'imgs/img6.png',
    'imgs/img7.png',
    'imgs/img8.png',
    'imgs/img9.png',
    'imgs/img10.png',
    'imgs/img11.png',
    'imgs/img12.png',
    'imgs/img13.png',
    'imgs/img14.png',
    'imgs/img15.png',
    'imgs/img16.png',
    'imgs/img17.png',
    'imgs/img18.png'
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

function updateSoundToggleUI() {
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.innerText = isMuted ? 'Sound: Off' : 'Sound: On';
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

function bestStorageKey(rank) {
    return `ragna-best-${rank.replace(/\s+/g, '-').toLowerCase()}`;
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

    const selectedImgs = monsterImages.slice(0, totalPairs);
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
            movesLeft--;
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
