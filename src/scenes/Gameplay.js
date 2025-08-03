import { fontStyles } from '../fontStyles.js';

export class Gameplay extends Phaser.Scene {

    constructor() {
        super('Gameplay');
        
        // Life configuration for different difficulty levels
        this.LIFE_CONFIG = {
            easy: {
                startingLife: 30,
                hitBonus: 5,
                missPenalty: 1,
                disappearPenalty: 2
            },
            normal: {
                startingLife: 20,
                hitBonus: 5,
                missPenalty: 1,
                disappearPenalty: 2
            },
            hard: {
                startingLife: 15,
                hitBonus: 5,
                missPenalty: 2,
                disappearPenalty: 4
            }
        };
        
        // Current difficulty (can be changed later for difficulty system)
        this.currentDifficulty = 'normal';
    }

    preload() {
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
        
        // Initialize life management system
        this.initializeLifeSystem();
        
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
        this.scoreText = this.add.text(50, 100, 'Score: 0', fontStyles.body);

        // Placeholder timer display
        this.timerText = this.add.text(1230, 50, 'Time: 30', fontStyles.body).setOrigin(1, 0);

        
        
        // Add audio unlock handler for Chrome autoplay policy
        this.setupAudioUnlock();
        
        // Create sound button
        this.createSoundButton();
        
        // Create life progress bar
        this.createLifeProgressBar();
        
        // Initialize life display
        this.updateLifeDisplay();
    }

    initializeLifeSystem() {
        // Get current difficulty config
        const config = this.LIFE_CONFIG[this.currentDifficulty];
        
        // Initialize life variables
        this.maxLife = config.startingLife;
        this.currentLife = config.startingLife;
        this.gameOver = false;
    }

    createLifeProgressBar() {
        // Progress bar dimensions and position
        const barWidth = 300;
        const barHeight = 25;
        const barX = 640; // Center of 1280px width
        const barY = 670; // Bottom of screen (720px height - 50px margin)
        
        // Create progress bar background
        this.lifeBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
        this.lifeBarBg.setStrokeStyle(2, 0xffffff);
        
        // Create progress bar fill
        this.lifeBarFill = this.add.rectangle(
            barX - barWidth / 2, 
            barY, 
            barWidth, 
            barHeight, 
            0x00ff00
        );
        this.lifeBarFill.setOrigin(0, 0.5);
        
        // Store bar properties for updates
        this.lifeBarWidth = barWidth;
        this.lifeBarHeight = barHeight;
        this.lifeBarX = barX;
        this.lifeBarY = barY;
    }

    updateLifeDisplay() {
        if (!this.lifeBarFill) return;
        
        // Calculate life percentage
        const lifePercentage = Math.max(0, this.currentLife / this.maxLife);
        
        console.log(`Life Percentage: ${lifePercentage * 100}%`);
        
        // Stop any existing tweens on the life bar
        this.tweens.killTweensOf(this.lifeBarFill);
        
        // Immediately set the scale to the correct percentage
        this.lifeBarFill.scaleX = lifePercentage;
        
        // Update bar width with smooth animation (optional, for visual effect)
        this.tweens.add({
            targets: this.lifeBarFill,
            scaleX: lifePercentage,
            duration: 300,
            ease: 'Power2'
        });
        
        // Update bar color based on life percentage
        let barColor = 0x00ff00; // Green
        if (lifePercentage <= 0.2) {
            barColor = 0xff0000; // Red
        } else if (lifePercentage <= 0.5) {
            barColor = 0xffff00; // Yellow
        }
        
        // Update color immediately
        this.lifeBarFill.setFillStyle(barColor);
    }

    addLife(amount) {
        if (this.gameOver) return;
        
        const previousLife = this.currentLife;
        const newLife = this.currentLife + amount;
        const cappedLife = Math.min(this.maxLife, newLife);
        
        this.currentLife = cappedLife;
        this.updateLifeDisplay();
        
        
    }

    removeLife(amount) {
        if (this.gameOver) return;
        
        this.currentLife = Math.max(0, this.currentLife - amount);
        this.updateLifeDisplay();
        
        // Check for game over
        if (this.currentLife <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        
        
        // Stop target spawning and clean up
        this.targets.forEach(target => {
            this.removeTarget(target, false);
        });
        
        // Add visual feedback for game over
        this.add.text(640, 360, 'GAME OVER', {
            ...fontStyles.title,
            fill: '#ff0000'
        }).setOrigin(0.5, 0.5);
        
        this.add.text(640, 420, 'Life Depleted!', fontStyles.body).setOrigin(0.5, 0.5);
        
        // TODO: Transition to game over scene in Phase 2
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
        
        ('Sound state initialized:', this.soundEnabled);
    }

    createSoundButton() {
        // Create sound button in top-left corner
        this.soundButton = this.add.text(50, 50, this.getSoundButtonText(), {
            ...fontStyles.button,
            fill: this.getSoundButtonColor()
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
        
        ('Sound button created');
    }

    getSoundButtonText() {
        return this.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    }

    getSoundButtonColor() {
        return this.soundEnabled ? '#00ff00' : '#ff0000';
    }

    toggleSound() {
        ('Sound button clicked, current state:', this.soundEnabled);
        
        // If this is the first interaction and audio is locked, unlock it
        if (this.sound.locked) {
            ('Unlocking audio on first interaction');
            this.sound.unlock();
            this.audioUnlocked = true;
        }
        
        // Toggle sound state
        this.soundEnabled = !this.soundEnabled;
        
        // Save preference to localStorage
        try {
            localStorage.setItem('soundEnabled', this.soundEnabled.toString());
            ('Sound preference saved:', this.soundEnabled);
        } catch (error) {
            console.warn('Could not save sound preference to localStorage:', error);
        }
        
        // Update button appearance
        this.updateSoundButton();
        
        // Update audio status display
        this.updateAudioStatus();
        
        ('Sound toggled to:', this.soundEnabled);
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
            ('Audio: LOCKED - Click sound button to unlock');
        } else {
            (`Audio: UNLOCKED (${contextState})`);
        }
    }

    setupAudioUnlock() {
        // Handle Chrome autoplay policy
        if (this.sound.locked) {
            ('Audio is locked, waiting for user interaction to unlock');
            
            // Add one-time unlock listener
            this.input.once('pointerdown', () => {
                ('User interaction detected, attempting to unlock audio');
                this.sound.unlock();
                this.audioUnlocked = true;
                ('Audio unlock attempted, locked status:', this.sound.locked);
                this.updateAudioStatus();
            });
        } else {
            ('Audio is already unlocked');
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
        
        ('Input system configured for single pointer mode');
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
        target.on('pointerdown', (pointer, localX, localY, event) => {
            // Stop the event from propagating to the scene's global click handler
            event.stopPropagation();
            this.hitTarget(target);
        });

        // Add to targets array
        this.targets.push(target);

        (`Target spawned at (${x}, ${y}). Active targets: ${this.targets.length}`);
        return target;
    }

    removeTarget(target, wasHit = false) {
        // Find and remove target from array
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
            
            // If target disappeared without being hit, apply life penalty
            if (!wasHit) {
                const config = this.LIFE_CONFIG[this.currentDifficulty];
                this.removeLife(config.disappearPenalty);
                (`Target disappeared! Life: -${config.disappearPenalty}`);
            }
            
            // Remove event listeners before destroying
            target.removeAllListeners();
            target.destroy();
            
            (`Target removed${wasHit ? ' (hit)' : ' (timeout)'}. Active targets: ${this.targets.length}`);
        }
    }

    playManagedSound(soundKey, volume = 1.0) {
        (`Attempting to play sound: ${soundKey} at volume ${volume}`);
        ('Sound enabled:', this.soundEnabled);
        ('Audio locked status:', this.sound.locked);
        ('Audio unlocked flag:', this.audioUnlocked);
        
        // Check if sound is enabled by user
        if (!this.soundEnabled) {
            ('Sound is disabled by user, not playing');
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
            ('Sound object created:', sound);
            
            // Add event listeners for debugging
            sound.once('play', () => {
                (`Sound '${soundKey}' started playing`);
            });
            
            sound.once('complete', () => {
                (`Sound '${soundKey}' finished playing`);
            });
            
            sound.once('stop', () => {
                (`Sound '${soundKey}' was stopped`);
            });
            
            // Attempt to play
            const playResult = sound.play();
            ('Play result:', playResult);
            
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
        
        // Add life for hitting target
        const config = this.LIFE_CONFIG[this.currentDifficulty];
        this.addLife(config.hitBonus);
        
        // Create explosion at target position
        const explosion = this.add.sprite(target.x, target.y, 'explosion');
        explosion.setScale(0.8); // Adjust size as needed
        
        ('Explosion sprite created at:', target.x, target.y);
        ('Explosion sprite visible:', explosion.visible);
        ('Playing explosion animation...');
        
        explosion.play('explode');
        
        // Remove explosion when animation completes
        explosion.on('animationcomplete', () => {
            ('Explosion animation completed');
            explosion.destroy();
        });
        
        // Add fallback removal in case animation doesn't complete
        this.time.delayedCall(500, () => {
            if (explosion && explosion.active) {
                ('Fallback: destroying explosion sprite');
                explosion.destroy();
            }
        });
        
        // Remove target with slight delay to let explosion start
        this.time.delayedCall(50, () => {
            this.removeTarget(target, true);
        });
        
        (`Target hit! Score: ${this.score} (+${this.hitPoints}), Life: +${config.hitBonus} - Explosion sound played`);
    }

    handleMiss(pointer) {
        // Play click sound for miss
        this.playManagedSound('click', 0.5);
        
        // Apply miss penalty
        this.score = Math.max(this.minScore, this.score + this.missPoints);
        this.updateScoreDisplay();
        
        // Remove life for missing
        const config = this.LIFE_CONFIG[this.currentDifficulty];
        this.removeLife(config.missPenalty);
        
        (`Miss! Score: ${this.score} (${this.missPoints}), Life: -${config.missPenalty} - Click sound played`);
        
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
        // Don't update if game is over
        if (this.gameOver) {
            return;
        }
        
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