export class Gameplay extends Phaser.Scene {

    constructor() {
        super('Gameplay');
    }

    preload() {
        // Load custom font using CSS
        this.load.css('pressStart2P', `
            @font-face {
                font-family: 'Press Start 2P';
                src: url('assets/PressStart2P-Regular.ttf') format('truetype');
            }
        `);
        
        // Load all required game assets
        this.load.image('target', 'assets/crosshair067.png');
        this.load.image('background', 'assets/bg_layer1.png');
        this.load.audio('click', 'assets/click_004.ogg');
        this.load.audio('explosion', 'assets/explosion.ogg');
        
        // Load ship sprite for targets
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
        
        // Load explosion spritesheet (4x3 grid, 12 frames)
        this.load.spritesheet('explosion', 'assets/explosion.png', {
            frameWidth: 128,  // Adjust based on actual image dimensions
            frameHeight: 128  // Adjust based on actual image dimensions
        });
    }

    create() {
        // Set up background
        this.background = this.add.image(640, 360, 'background');
        this.background.setDisplaySize(1280, 720);

        // Initialize game variables
        this.score = 0;
        this.timeLeft = 30;
        this.targets = [];
        this.gameStartTime = this.time.now;
        
        // Audio management
        this.maxConcurrentSounds = 3;
        this.activeSounds = [];
        this.audioUnlocked = false;
        
        // Global sound state management
        this.initializeSoundState();
        
        // Target spawning configuration
        this.maxTargets = 4;
        this.targetLifespan = 4000; // 4 seconds
        this.initialSpawnRate = 2000; // 2 seconds
        this.minSpawnRate = 800; // minimum spawn rate
        this.lastSpawnTime = 0;
        this.currentSpawnRate = this.initialSpawnRate;
        
        // Scoring configuration
        this.hitPoints = 10;
        this.missPoints = -2;
        this.minScore = 0;
        
        // Safe spawn boundaries (50px margin from edges)
        this.spawnBounds = {
            minX: 50 + 88, // 88 is half ship width
            maxX: 1280 - 50 - 88,
            minY: 50 + 48, // 48 is half ship height  
            maxY: 720 - 50 - 48
        };
        
        // Set up input system
        this.setupInputSystem();
        
        // Create explosion animation
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 11 }),
            frameRate: 40,
            repeat: 0
        });

        // Placeholder score display
        this.scoreText = this.add.text(50, 100, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", monospace'
        });

        // Placeholder timer display
        this.timerText = this.add.text(1230, 50, 'Time: 30', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", monospace'
        }).setOrigin(1, 0);

        console.log('Gameplay scene created successfully');
        
        // Add audio unlock handler for Chrome autoplay policy
        this.setupAudioUnlock();
        
        // Create sound button
        this.createSoundButton();
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
        
        console.log('Sound state initialized:', this.soundEnabled);
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
        
        console.log('Sound button created');
    }

    getSoundButtonText() {
        return this.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    }

    getSoundButtonColor() {
        return this.soundEnabled ? '#00ff00' : '#ff0000';
    }

    toggleSound() {
        console.log('Sound button clicked, current state:', this.soundEnabled);
        
        // If this is the first interaction and audio is locked, unlock it
        if (this.sound.locked) {
            console.log('Unlocking audio on first interaction');
            this.sound.unlock();
            this.audioUnlocked = true;
        }
        
        // Toggle sound state
        this.soundEnabled = !this.soundEnabled;
        
        // Save preference to localStorage
        try {
            localStorage.setItem('soundEnabled', this.soundEnabled.toString());
            console.log('Sound preference saved:', this.soundEnabled);
        } catch (error) {
            console.warn('Could not save sound preference to localStorage:', error);
        }
        
        // Update button appearance
        this.updateSoundButton();
        
        // Update audio status display
        this.updateAudioStatus();
        
        console.log('Sound toggled to:', this.soundEnabled);
    }

    updateSoundButton() {
        if (this.soundButton) {
            this.soundButton.setText(this.getSoundButtonText());
            this.soundButton.setFill(this.getSoundButtonColor());
        }
    }

    updateAudioStatus() {
        const locked = this.sound.locked;
        const contextState = this.sound.context ? this.sound.context.state : 'unknown';
        
        // Audio status logging only (no visual display)
        if (locked) {
            console.log('Audio: LOCKED - Click sound button to unlock');
        } else {
            console.log(`Audio: UNLOCKED (${contextState})`);
        }
    }

    setupAudioUnlock() {
        // Handle Chrome autoplay policy
        if (this.sound.locked) {
            console.log('Audio is locked, waiting for user interaction to unlock');
            
            // Add one-time unlock listener
            this.input.once('pointerdown', () => {
                console.log('User interaction detected, attempting to unlock audio');
                this.sound.unlock();
                this.audioUnlocked = true;
                console.log('Audio unlock attempted, locked status:', this.sound.locked);
                this.updateAudioStatus();
            });
        } else {
            console.log('Audio is already unlocked');
            this.audioUnlocked = true;
            this.updateAudioStatus();
        }
    }

    setupInputSystem() {
        // Configure input for single pointer mode (mobile compatibility)
        this.input.maxPointers = 1;
        
        // Global background click handler for miss detection
        this.input.on('pointerdown', (pointer) => {
            // This will be called for all clicks, including target hits
            // Target hits will be handled by individual target listeners
            // We'll use a flag to detect if a target was hit
            this.clickedOnTarget = false;
            
            // Small delay to allow target events to fire first
            this.time.delayedCall(10, () => {
                if (!this.clickedOnTarget) {
                    this.handleMiss(pointer);
                }
            });
        });
        
        console.log('Input system configured for single pointer mode');
    }

    createTarget() {
        // Check if we can spawn more targets
        if (this.targets.length >= this.maxTargets) {
            return null;
        }

        // Generate random position within safe bounds
        const x = Phaser.Math.Between(this.spawnBounds.minX, this.spawnBounds.maxX);
        const y = Phaser.Math.Between(this.spawnBounds.minY, this.spawnBounds.maxY);

        // Create target sprite
        const target = this.add.sprite(x, y, 'ship');
        target.setFrame(0); // Use first frame of ship sprite
        target.setScale(0.8); // Make targets slightly smaller
        
        // Make target interactive
        target.setInteractive();
        
        // Add target properties
        target.spawnTime = this.time.now;
        target.isTarget = true;
        target.isBeingDestroyed = false;
        
        // Add click event listener
        target.on('pointerdown', () => {
            this.hitTarget(target);
        });

        // Add to targets array
        this.targets.push(target);

        console.log(`Target spawned at (${x}, ${y}). Active targets: ${this.targets.length}`);
        return target;
    }

    removeTarget(target, wasHit = false) {
        // Find and remove target from array
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
            
            // Remove event listeners before destroying
            target.removeAllListeners();
            target.destroy();
            
            console.log(`Target removed${wasHit ? ' (hit)' : ' (timeout)'}. Active targets: ${this.targets.length}`);
        }
    }

    playManagedSound(soundKey, volume = 1.0) {
        console.log(`Attempting to play sound: ${soundKey} at volume ${volume}`);
        console.log('Sound enabled:', this.soundEnabled);
        console.log('Audio locked status:', this.sound.locked);
        console.log('Audio unlocked flag:', this.audioUnlocked);
        
        // Check if sound is enabled by user
        if (!this.soundEnabled) {
            console.log('Sound is disabled by user, not playing');
            return null;
        }
        
        // Check if audio is available
        if (this.sound.locked) {
            console.warn('Audio is locked by browser policy, cannot play sound');
            return null;
        }
        
        // Check if sound exists
        if (!this.cache.audio.exists(soundKey)) {
            console.error(`Sound '${soundKey}' not found in cache`);
            return null;
        }
        
        try {
            // Remove finished sounds from active list
            this.activeSounds = this.activeSounds.filter(sound => sound.isPlaying);
            
            // If we're at the limit, stop the oldest sound
            if (this.activeSounds.length >= this.maxConcurrentSounds) {
                const oldestSound = this.activeSounds.shift();
                if (oldestSound && oldestSound.isPlaying) {
                    oldestSound.stop();
                }
            }
            
            // Create and play the new sound
            const sound = this.sound.add(soundKey, { volume });
            console.log('Sound object created:', sound);
            
            // Add event listeners for debugging
            sound.once('play', () => {
                console.log(`Sound '${soundKey}' started playing`);
            });
            
            sound.once('complete', () => {
                console.log(`Sound '${soundKey}' finished playing`);
            });
            
            sound.once('stop', () => {
                console.log(`Sound '${soundKey}' was stopped`);
            });
            
            // Attempt to play
            const playResult = sound.play();
            console.log('Play result:', playResult);
            
            this.activeSounds.push(sound);
            return sound;
            
        } catch (error) {
            console.error('Error playing sound:', error);
            return null;
        }
    }

    hitTarget(target) {
        // Prevent multiple hits on same target
        if (target.isBeingDestroyed) {
            return;
        }
        
        // Mark target as being destroyed
        target.isBeingDestroyed = true;
        
        // Set flag to prevent miss detection
        this.clickedOnTarget = true;
        
        // Play explosion sound
        this.playManagedSound('explosion', 0.7);
        
        // Update score
        this.score += this.hitPoints;
        this.updateScoreDisplay();
        
        // Create explosion at target position
        const explosion = this.add.sprite(target.x, target.y, 'explosion');
        explosion.setScale(0.8); // Adjust size as needed
        
        console.log('Explosion sprite created at:', target.x, target.y);
        console.log('Explosion sprite visible:', explosion.visible);
        console.log('Playing explosion animation...');
        
        explosion.play('explode');
        
        // Remove explosion when animation completes
        explosion.on('animationcomplete', () => {
            console.log('Explosion animation completed');
            explosion.destroy();
        });
        
        // Add fallback removal in case animation doesn't complete
        this.time.delayedCall(500, () => {
            if (explosion && explosion.active) {
                console.log('Fallback: destroying explosion sprite');
                explosion.destroy();
            }
        });
        
        // Remove target with slight delay to let explosion start
        this.time.delayedCall(50, () => {
            this.removeTarget(target, true);
        });
        
        console.log(`Target hit! Score: ${this.score} (+${this.hitPoints}) - Explosion sound played`);
    }

    handleMiss(pointer) {
        // Play click sound for miss
        this.playManagedSound('click', 0.5);
        
        // Apply miss penalty
        this.score = Math.max(this.minScore, this.score + this.missPoints);
        this.updateScoreDisplay();
        
        console.log(`Miss! Score: ${this.score} (${this.missPoints}) - Click sound played`);
        
        // Optional: Add visual feedback for miss
        // Could add a brief red flash or miss indicator here
    }

    updateScoreDisplay() {
        this.scoreText.setText(`Score: ${this.score}`);
    }

    updateSpawnRate() {
        // Progressive difficulty: reduce spawn rate over time
        const elapsedTime = this.time.now - this.gameStartTime;
        const difficultyFactor = Math.floor(elapsedTime / 5000); // Every 5 seconds
        
        this.currentSpawnRate = Math.max(
            this.minSpawnRate,
            this.initialSpawnRate - (difficultyFactor * 50)
        );
    }

    update() {
        const currentTime = this.time.now;
        
        // Update spawn rate based on difficulty progression
        this.updateSpawnRate();
        
        // Check if it's time to spawn a new target
        if (currentTime - this.lastSpawnTime > this.currentSpawnRate) {
            this.createTarget();
            this.lastSpawnTime = currentTime;
        }
        
        // Check for expired targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            if (!target.isBeingDestroyed && currentTime - target.spawnTime > this.targetLifespan) {
                this.removeTarget(target, false);
            }
        }
    }
}