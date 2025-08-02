export class Gameplay extends Phaser.Scene {

    constructor() {
        super('Gameplay');
    }

    preload() {
        // Load all required game assets
        this.load.image('target', 'assets/crosshair067.png');
        this.load.image('background', 'assets/bg_layer1.png');
        this.load.audio('click', 'assets/click_004.ogg');
        
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

        // Add development verification text
        this.add.text(640, 100, 'GAMEPLAY SCENE ACTIVE', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(640, 150, 'Assets Loaded Successfully', {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Add placeholder for future game elements
        this.add.text(640, 300, 'Target Interaction System Active', {
            fontSize: '18px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Initialize game variables
        this.score = 0;
        this.timeLeft = 30;
        this.targets = [];
        this.gameStartTime = this.time.now;
        
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
        this.scoreText = this.add.text(50, 50, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Placeholder timer display
        this.timerText = this.add.text(1230, 50, 'Time: 30', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        // Development info display
        this.targetCountText = this.add.text(640, 650, 'Targets: 0/4', {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        console.log('Gameplay scene created successfully');
        console.log('Assets loaded:', {
            target: this.textures.exists('target'),
            background: this.textures.exists('background'),
            click: this.cache.audio.exists('click'),
            ship: this.textures.exists('ship'),
            explosion: this.textures.exists('explosion')
        });
        console.log('Spawn bounds:', this.spawnBounds);
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

    hitTarget(target) {
        // Prevent multiple hits on same target
        if (target.isBeingDestroyed) {
            return;
        }
        
        // Mark target as being destroyed
        target.isBeingDestroyed = true;
        
        // Set flag to prevent miss detection
        this.clickedOnTarget = true;
        
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
        
        console.log(`Target hit! Score: ${this.score} (+${this.hitPoints})`);
    }

    handleMiss(pointer) {
        // Apply miss penalty
        this.score = Math.max(this.minScore, this.score + this.missPoints);
        this.updateScoreDisplay();
        
        console.log(`Miss! Score: ${this.score} (${this.missPoints})`);
        
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
        
        // Update development displays
        this.targetCountText.setText(`Targets: ${this.targets.length}/${this.maxTargets}`);
    }
}