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

// Timer Variables
let secondsElapsed = 0;
let timerInterval = null;

function setDiff(name, count, moves) {
    currentDiff = name;
    totalPairs = count / 2;
    movesLeft = moves;
    maxMoves = moves;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('bg-amber-900/40', 'border-amber-300'));
    event.target.classList.add('bg-amber-900/40', 'border-amber-300');
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
    if (!currentDiff) return alert('Choose your path first, adventurer!');

    document.getElementById('setup-modal').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');

    document.getElementById('ui-name').innerText = name;
    document.getElementById('ui-diff').innerText = currentDiff;

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

// Add this to handle screen rotation or resizing
window.addEventListener('resize', () => {
    if (!document.getElementById('game-ui').classList.contains('hidden')) {
        initGrid();
    }
});

function flipCard(cardEl, img) {
    if (flippedCards.length < 2 && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
        flippedCards.push({ el: cardEl, img: img });

        if (flippedCards.length === 2) {
            movesLeft--;
            setTimeout(checkMatch, 600);
        }
    }
}

function checkMatch() {
    const [c1, c2] = flippedCards;

    if (c1.img === c2.img) {
        matches++;
        // STABILITY FIX: We add a class but don't change the scale/filter of the parent
        c1.el.classList.add('matched-card');
        c2.el.classList.add('matched-card');
        // Change border to emerald to indicate success
        c1.el.querySelector('.card-front').style.borderColor = '#2f5233';
        c2.el.querySelector('.card-front').style.borderColor = '#2f5233';
    } else {
        c1.el.classList.remove('flipped');
        c2.el.classList.remove('flipped');
    }

    flippedCards = [];
    updateUI();
    checkGameOver();
}

function updateUI() {
    document.getElementById('ui-matches').innerText = `${matches} / ${totalPairs}`;
    document.getElementById('ui-moves').innerText = movesLeft;
    const percentage = (movesLeft / maxMoves) * 100;
    const bar = document.getElementById('stamina-bar');
    bar.style.width = percentage + '%';

    if (percentage < 25) bar.style.backgroundColor = '#7a1620';
    else if (percentage < 50) bar.style.backgroundColor = '#c9a227';
}

function checkGameOver() {
    if (matches === totalPairs) {
        clearInterval(timerInterval);
        alert(`QUEST COMPLETE! Time: ${secondsElapsed}s | Moves Left: ${movesLeft}`);
        location.reload();
    } else if (movesLeft <= 0) {
        clearInterval(timerInterval);
        alert('YOU HAVE BEEN DEFEATED! No moves remain — return to a save point.');
        location.reload();
    }
}
