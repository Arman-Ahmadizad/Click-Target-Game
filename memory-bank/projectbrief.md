# Click Target Game - Project Brief

## Project Overview

**Title:** Click Target Game  
**Genre:** Casual / Reaction Game  
**Platform:** Web (Desktop & Mobile Browser)  
**Framework:** Phaser 3 (HTML5/JavaScript)

## Core Objective

Create a simple, fast-paced casual game where players click or tap on targets that appear randomly on screen to survive as long as possible using a life-based system.

## Key Requirements

### Core Gameplay Features

- **Random Target Spawning**: Targets appear at random locations with progressive timing that gets faster over time
- **Click/Tap Interaction**: Support both mouse clicks and touch input for mobile
- **Life-Based System**: Players start with fixed life amount that changes based on actions
- **Life Management**: Target hits add life, misses and missed targets reduce life
- **Progressive Survival Gameplay**: Game becomes increasingly difficult until impossible to continue
- **Sound Effects**: Audio feedback for successful hits and life changes
- **Game States**: Start screen, gameplay, and game over screens
- **Progressive Difficulty**: Spawn rates decrease from 2000ms to 200ms, target count increases from 4 to 12+, target lifespan reduces from 4000ms to 1500ms
- **Record Tracking**: Persistent high score system to motivate record-breaking attempts
- **Performance Optimization**: Mobile-specific optimizations and FPS monitoring

### Technical Requirements

- **Responsive Design**: Works on both desktop and mobile browsers
- **Cross-platform Input**: Seamless mouse and touch input handling
- **Asset Management**: Proper loading and management of sprites and audio
- **Performance**: Smooth 60fps gameplay experience

### Asset Specifications

- **Target Sprite**: crosshair067.png from Kenney Crosshair Pack
- **Background**: bg_layer1.png from Kenney Abstract Platformer Pack
- **Click Sound**: click_004.wav from Kenney Interface Sounds
- **Font**: "Press Start 2P" from Google Fonts (optional)

## Success Metrics

- Smooth, responsive gameplay throughout difficulty progression
- Intuitive mobile and desktop experience with performance optimization
- Engaging progressive survival mechanics that escalate to "impossible" difficulty
- Stable performance across different devices with automatic quality scaling
- Persistent record tracking that motivates repeated play attempts
- Frame rate maintenance of 60fps even at maximum difficulty levels
