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
        this.add.text(640, 300, 'Target Spawning System Active', {
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
        
        // Safe spawn boundaries (50px margin from edges)
        this.spawnBounds = {
            minX: 50 + 88, // 88 is half ship width
            maxX: 1280 - 50 - 88,
            minY: 50 + 48, // 48 is half ship height  
            maxY: 720 - 50 - 48
        };

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
            ship: this.textures.exists('ship')
        });
        console.log('Spawn bounds:', this.spawnBounds);
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
        
        // Add target properties
        target.spawnTime = this.time.now;
        target.isTarget = true;

        // Add to targets array
        this.targets.push(target);

        console.log(`Target spawned at (${x}, ${y}). Active targets: ${this.targets.length}`);
        return target;
    }

    removeTarget(target) {
        // Find and remove target from array
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
            target.destroy();
            console.log(`Target removed. Active targets: ${this.targets.length}`);
        }
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
            if (currentTime - target.spawnTime > this.targetLifespan) {
                this.removeTarget(target);
            }
        }
        
        // Update development displays
        this.targetCountText.setText(`Targets: ${this.targets.length}/${this.maxTargets}`);
    }
}