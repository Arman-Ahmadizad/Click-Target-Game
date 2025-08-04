import { Start } from './scenes/Start.js';
import { Gameplay } from './scenes/Gameplay.js';
import { GameOver } from './scenes/GameOver.js';

const config = {
    type: Phaser.AUTO,
    title: 'Click Target Game',
    description: 'Progressive survival reaction game',
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Start,
        Gameplay,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

const game = new Phaser.Game(config);

// Enhanced resize handling function
function handleResize() {
    // Force a small delay to ensure viewport has updated
    setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        console.log(`Resizing game to: ${newWidth}x${newHeight}`);
        
        // Update the game scale
        game.scale.resize(newWidth, newHeight);
        
        // Force a refresh of the scale manager
        game.scale.refresh();
    }, 150);
}

// Handle window resize events
window.addEventListener('resize', handleResize);

// Handle orientation change events for mobile with enhanced detection
window.addEventListener('orientationchange', () => {
    console.log('Orientation change detected');
    
    // Multiple attempts with increasing delays to handle different mobile browsers
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 300);
    setTimeout(handleResize, 500);
});

// Additional orientation change detection using screen object
if (screen && screen.orientation) {
    screen.orientation.addEventListener('change', () => {
        console.log('Screen orientation change detected');
        handleResize();
    });
}

// Detect viewport changes on mobile (iOS Safari specific)
window.addEventListener('resize', () => {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Force viewport recalculation on mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const content = viewport.getAttribute('content');
            viewport.setAttribute('content', content + ', user-scalable=no');
            setTimeout(() => {
                viewport.setAttribute('content', content);
            }, 50);
        }
    }
});