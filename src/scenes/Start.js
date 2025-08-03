export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        // Load custom font using CSS
        this.load.css('pressStart2P', `
            @font-face {
                font-family: 'Press Start 2P';
                src: url('assets/PressStart2P-Regular.ttf') format('truetype');
            }
        `);
        
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');

        //  The ship sprite is CC0 from https://ansimuz.itch.io - check out his other work!
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        const logo = this.add.image(640, 200, 'logo');

        const ship = this.add.sprite(640, 360, 'ship');

        ship.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 15,
            repeat: -1
        });

        ship.play('fly');

        this.tweens.add({
            targets: logo,
            y: 400,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });
        
        // Initialize sound state and create sound button
        this.initializeSoundState();
        this.createSoundButton();
    }

    update() {
        this.background.tilePositionX += 2;
    }
    
    initializeSoundState() {
        // Load sound preference from localStorage
        const savedSoundState = localStorage.getItem('soundEnabled');
        
        if (savedSoundState !== null) {
            this.soundEnabled = savedSoundState === 'true';
        } else {
            // Default to sound enabled
            this.soundEnabled = true;
        }
        
        console.log('Sound state initialized in Start scene:', this.soundEnabled);
    }

    createSoundButton() {
        // Create sound button in top-left corner
        this.soundButton = this.add.text(50, 50, this.getSoundButtonText(), {
            fontSize: '18px',
            fill: this.getSoundButtonColor(),
            fontFamily: '"Press Start 2P", monospace',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        
        // Make button interactive
        this.soundButton.setInteractive();
        this.soundButton.on('pointerdown', () => {
            this.toggleSound();
        });
        
        // Add hover effects
        this.soundButton.on('pointerover', () => {
            this.soundButton.setScale(1.1);
        });
        
        this.soundButton.on('pointerout', () => {
            this.soundButton.setScale(1.0);
        });
        
        console.log('Sound button created in Start scene');
    }

    getSoundButtonText() {
        return this.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    }

    getSoundButtonColor() {
        return this.soundEnabled ? '#00ff00' : '#ff0000';
    }

    toggleSound() {
        console.log('Sound button clicked in Start scene, current state:', this.soundEnabled);
        
        // If this is the first interaction and audio is locked, unlock it
        if (this.sound.locked) {
            console.log('Unlocking audio on first interaction in Start scene');
            this.sound.unlock();
        }
        
        // Toggle sound state
        this.soundEnabled = !this.soundEnabled;
        
        // Save preference to localStorage
        try {
            localStorage.setItem('soundEnabled', this.soundEnabled.toString());
            console.log('Sound preference saved from Start scene:', this.soundEnabled);
        } catch (error) {
            console.warn('Could not save sound preference to localStorage:', error);
        }
        
        // Update button appearance
        this.updateSoundButton();
        
        console.log('Sound toggled to in Start scene:', this.soundEnabled);
    }

    updateSoundButton() {
        if (this.soundButton) {
            this.soundButton.setText(this.getSoundButtonText());
            this.soundButton.setFill(this.getSoundButtonColor());
        }
    }
    
}
