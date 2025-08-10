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

// Enhanced mobile-aware resize handling function
function handleResize() {
    // Force a small delay to ensure viewport has updated
    setTimeout(() => {
        // Get actual viewport dimensions
        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;
        
        // Mobile browser viewport handling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Use visual viewport if available (modern browsers)
            if (window.visualViewport) {
                newWidth = window.visualViewport.width;
                newHeight = window.visualViewport.height;
            } else {
                // Fallback: Use document dimensions for better mobile compatibility
                newHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
            }
        }
        
        console.log(`Resizing game to: ${newWidth}x${newHeight} (Mobile: ${isMobile})`);
        
        // Update the game scale
        game.scale.resize(newWidth, newHeight);
        
        // Force multiple refreshes for mobile compatibility
        game.scale.refresh();
        
        // Additional refresh after short delay for mobile browsers
        if (isMobile) {
            setTimeout(() => {
                game.scale.refresh();
            }, 100);
        }
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
    setTimeout(handleResize, 800); // Additional delay for stubborn browsers
});

// Additional orientation change detection using screen object
if (screen && screen.orientation) {
    screen.orientation.addEventListener('change', () => {
        console.log('Screen orientation change detected');
        handleResize();
    });
}

// Visual Viewport API support for modern mobile browsers
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        console.log('Visual viewport resize detected');
        handleResize();
    });
}

// Enhanced mobile viewport change detection
window.addEventListener('resize', () => {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Force viewport recalculation on mobile with improved method
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            // Temporarily modify viewport to force refresh
            const originalContent = viewport.getAttribute('content');
            viewport.setAttribute('content', originalContent + ', minimal-ui');
            setTimeout(() => {
                viewport.setAttribute('content', originalContent);
            }, 50);
        }
    }
});