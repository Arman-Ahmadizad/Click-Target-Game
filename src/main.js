import { Start } from './scenes/Start.js';
import { Gameplay } from './scenes/Gameplay.js';
import { GameOver } from './scenes/GameOver.js';

// Get initial viewport dimensions properly
const initialWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
const initialHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

const config = {
    type: Phaser.AUTO,
    title: 'Click Target Game',
    description: 'Progressive survival reaction game',
    parent: 'game-container',
    width: initialWidth,
    height: initialHeight,
    backgroundColor: '#000000',
    pixelArt: false,
    antialias: true,
    scene: [
        Start,
        Gameplay,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: initialWidth,
        height: initialHeight
    },
    render: {
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        antialias: true,
        pixelArt: false
    }
}

const game = new Phaser.Game(config);

// Ensure correct initial dimensions after game creation
game.events.once('ready', () => {
    console.log('Game ready - checking initial dimensions and zoom state...');
    logViewportInfo('Game Ready');
    
    // Detect initial browser zoom
    const initialZoom = detectBrowserZoom();
    if (initialZoom !== 1.0) {
        console.log(`Initial zoom detected: ${initialZoom}, attempting reset...`);
        resetBrowserZoom();
    }
    
    // Fix any initial dimension mismatch
    const currentWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    if (game.scale.width !== currentWidth || game.scale.height !== currentHeight) {
        console.log('Initial dimension mismatch detected, correcting...');
        game.scale.resize(currentWidth, currentHeight);
        game.scale.refresh();
        logViewportInfo('After Initial Correction');
    }
});

// Debug function to log viewport information
function logViewportInfo(context) {
    console.log(`=== ${context} ===`);
    console.log(`window.innerWidth: ${window.innerWidth}`);
    console.log(`window.innerHeight: ${window.innerHeight}`);
    console.log(`document.documentElement.clientWidth: ${document.documentElement.clientWidth}`);
    console.log(`document.documentElement.clientHeight: ${document.documentElement.clientHeight}`);
    
    if (window.visualViewport) {
        console.log(`visualViewport.width: ${window.visualViewport.width}`);
        console.log(`visualViewport.height: ${window.visualViewport.height}`);
    }
    
    if (game && game.scale) {
        console.log(`game.scale.width: ${game.scale.width}`);
        console.log(`game.scale.height: ${game.scale.height}`);
        console.log(`game.scale.gameSize.width: ${game.scale.gameSize.width}`);
        console.log(`game.scale.gameSize.height: ${game.scale.gameSize.height}`);
    }
    
    // Add zoom detection
    detectBrowserZoom();
    
    console.log('================');
}

// Function to detect browser zoom level
function detectBrowserZoom() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
    const zoomLevel = Math.round((devicePixelRatio * zoom) * 100) / 100;
    
    console.log(`Browser zoom detection:`, {
        devicePixelRatio,
        zoom,
        zoomLevel,
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight
    });
    
    return zoomLevel;
}

// Function to reset browser zoom state by manipulating viewport meta tag
function resetBrowserZoom() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        console.log('Resetting browser zoom state...');
        
        // Store original content
        const originalContent = viewport.getAttribute('content');
        
        // Temporarily remove viewport constraints
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        
        // Force layout recalculation
        document.body.offsetHeight;
        
        // Restore original content after brief delay
        setTimeout(() => {
            viewport.setAttribute('content', originalContent);
            // Force another layout recalculation
            document.body.offsetHeight;
        }, 10);
    }
}

// Enhanced mobile-aware resize handling function with viewport reset
function handleResize() {
    // Prevent multiple rapid resize calls
    clearTimeout(window.resizeTimeout);
    
    window.resizeTimeout = setTimeout(() => {
        logViewportInfo('Before Resize');
        
        // Force browser zoom reset by manipulating viewport meta tag
        resetBrowserZoom();
        
        // Get current viewport dimensions
        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;
        
        // For mobile browsers, use visual viewport when available
        if (window.visualViewport) {
            newWidth = window.visualViewport.width;
            newHeight = window.visualViewport.height;
        }
        
        console.log(`Orientation change: resizing to ${newWidth}x${newHeight}`);
        
        // Direct canvas manipulation for immediate effect
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;
        }
        
        // Update Phaser scale configuration
        game.scale.resize(newWidth, newHeight);
        
        // Also update game size to ensure consistency
        game.scale.setGameSize(newWidth, newHeight);
        
        // Force canvas to update
        game.scale.refresh();
        
        // Double-check dimensions are correct after a brief delay
        setTimeout(() => {
            if (game.scale.width !== newWidth || game.scale.height !== newHeight) {
                console.log('Dimensions still mismatched, forcing correction...');
                game.scale.resize(newWidth, newHeight);
                game.scale.refresh();
            }
            
            // Final canvas size check
            if (canvas) {
                canvas.style.width = `${newWidth}px`;
                canvas.style.height = `${newHeight}px`;
            }
            
            logViewportInfo('After Resize (Final Check)');
        }, 50);
        
        logViewportInfo('After Resize');
        
    }, 200); // Longer delay for more stable results
}

// Handle window resize events
window.addEventListener('resize', handleResize);

// Simplified orientation change handling
window.addEventListener('orientationchange', () => {
    console.log('Orientation change detected - waiting for viewport to stabilize');
    
    // Single delayed call instead of multiple attempts
    setTimeout(() => {
        handleResize();
    }, 300);
});

// Visual Viewport API support for modern mobile browsers
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        console.log('Visual viewport change detected');
        handleResize();
    });
}