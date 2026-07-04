# 🕹️ Ragna-Memory: Evolution
**Ragna-Memory: Evolution** is a high-fidelity, web-based memory matching game inspired by the classic MMORPG Ragnarok Online. Built with a medieval-fantasy aesthetic of parchment, carved wood, and gold, it challenges adventurers to match monster cards under the pressure of a move-based counter and a real-time clock.

## ✨ Features
- **Adaptive Difficulty**: Choose your rank from Novice (4x3) to Lord Knight (6x6).

- **Moves System**: Every flip costs a move. Run out, and you're defeated!

- **iOS/Safari Optimized**: Custom 3D CSS logic ensures smooth card flips without "ghosting" on iPhones.

- **Dynamic Visuals**: Features a glowing Kafra-crystal card-back design set in a carved gold ring, with emerald match effects.

## 🚀 Live Demo
Check out the game in action here: [ragna-memories](https://ewertonce.github.io/ragna-memories/)

## 🛠️ Tech Stack
**HTML5 & CSS3** (`style.css`): Semantic structure and custom 3D transforms.

**Tailwind CSS**: For the responsive UI layout.

**Vanilla JavaScript** (`game.js`): Core game logic, state management, and timers.

## 📦 Installation & Setup
You don't need to install any dependencies. This is a "portable" project!

<ol>
  <li>Clone the repository: <code>git clone https://github.com/ewertonce/ragna-memories.git</code></li>
  <li>Open the project: Simply double-click <code>index.html</code> to run it in your favorite browser.</li>
</ol>  


## 🎨 Customizing Your Monsters
To use your own monster images, simply update the <code>monsterImages</code> array in <code>game.js</code>:

    const monsterImages = [
    'path/to/your/monster1.png',
    'path/to/your/monster2.png',
    // ... add up to 18 unique images
    ];
## 🐞 Mobile Fixes Included
This project includes specific CSS overrides to handle WebKit (Safari/iOS) rendering bugs:

<code>transform-style: preserve-3d</code> for layer stability.

<code>translateZ(1px)</code> to prevent card-back bleeding.

<code>-webkit-backface-visibility: hidden</code> for smooth 180-degree rotations.

## 📜 License
Distributed under the MIT License. See <code>LICENSE</code> for more information.
