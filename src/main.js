import { Start } from './scenes/Start.js';
import { Gameplay } from './scenes/Gameplay.js';
import { GameOver } from './scenes/GameOver.js';

function launchGame() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (window.visualViewport) {
        width = window.visualViewport.width;
        height = window.visualViewport.height;
    console.log(`Launching game with dimensions: ${width}x${height}`);
    }

    const config = {
        type: Phaser.AUTO,
        title: 'Click Target Game',
        description: 'Progressive survival reaction game',
        parent: 'game-container',
        width: width,
        height: height,
        backgroundColor: '#000000',
        pixelArt: false,
        antialias: true,
        scene: [
            Start,
            Gameplay,
            GameOver
        ],
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
            transparent: false,
            clearBeforeRender: true,
            preserveDrawingBuffer: false,
            antialias: true,
            pixelArt: false
        }
    };

    const game = new Phaser.Game(config);
}

window.addEventListener('load', () => {
    setTimeout(launchGame, 100);
});
