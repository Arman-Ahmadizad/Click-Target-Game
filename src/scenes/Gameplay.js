import { fontStyles } from "../fontStyles.js";

export class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");

    // Life configuration for different difficulty levels
    this.LIFE_CONFIG = {
      easy: {
        startingLife: 30,
        hitBonus: 5,
        missPenalty: 1,
        disappearPenalty: 2,
      },
      normal: {
        startingLife: 20,
        hitBonus: 5,
        missPenalty: 1,
        disappearPenalty: 2,
      },
      hard: {
        startingLife: 15,
        hitBonus: 5,
        missPenalty: 2,
        disappearPenalty: 4,
      },
    };

    // Current difficulty (can be changed later for difficulty system)
    this.currentDifficulty = "normal";
  }

  preload() {
    // Load all required game assets
    this.load.image("target", "assets/crosshair067.png");
    this.load.image("background", "assets/bg_layer1.png");
    this.load.audio("click", "assets/click_004.ogg");
    this.load.audio("explosion", "assets/explosion.ogg");

    // Load ship sprite for targets
    this.load.spritesheet("ship", "assets/spaceship.png", {
      frameWidth: 176,
      frameHeight: 96,
    });

    // Load explosion spritesheet (4x3 grid, 12 frames)
    this.load.spritesheet("explosion", "assets/explosion.png", {
      frameWidth: 128, // Adjust based on actual image dimensions
      frameHeight: 128, // Adjust based on actual image dimensions
    });
  }

  create() {
    // Set up background to cover entire screen
    this.background = this.add.image(0, 0, "background");
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    // Initialize game variables
    this.hits = 0; // Track successful target hits
    this.targets = [];
    this.gameStartTime = this.time.now;

    // Initialize difficulty management system
    this.initializeDifficultySystem();

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

    // Safe spawn boundaries (responsive margins)
    this.updateSpawnBounds();

    // Set up input system
    this.setupInputSystem();

    // Create explosion animation
    this.anims.create({
      key: "explode",
      frames: this.anims.generateFrameNumbers("explosion", {
        start: 0,
        end: 11,
      }),
      frameRate: 40,
      repeat: 0,
    });

    // Placeholder hits display (responsive positioning)
    this.hitsText = this.add
      .text(this.cameras.main.width - 50, 50, "Hits: 0", fontStyles.body)
      .setOrigin(1, 0);

    // Add audio unlock handler for Chrome autoplay policy
    this.setupAudioUnlock();

    // Create sound button
    this.createSoundButton();

    // Create life progress bar
    this.createLifeProgressBar();

    // Initialize life display
    this.updateLifeDisplay();

    // Fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Handle resize events
    this.scale.on('resize', this.handleResize, this);
  }

  updateSpawnBounds() {
    // Safe spawn boundaries (responsive margins)
    const margin = 50;
    const shipHalfWidth = 88;
    const shipHalfHeight = 48;
    
    this.spawnBounds = {
      minX: margin + shipHalfWidth,
      maxX: this.cameras.main.width - margin - shipHalfWidth,
      minY: margin + shipHalfHeight,
      maxY: this.cameras.main.height - margin - shipHalfHeight,
    };
  }

  handleResize(gameSize) {
    console.log('Scene resize event:', gameSize);
    
    // Update background size
    if (this.background) {
      this.background.setDisplaySize(gameSize.width, gameSize.height);
    }

    // Update spawn boundaries
    this.updateSpawnBounds();

    // Update UI positions
    if (this.hitsText) {
      this.hitsText.setPosition(gameSize.width - 50, 50);
    }

    if (this.soundButton) {
      this.soundButton.setPosition(50, 50);
    }

    // Update life progress bar position
    if (this.lifeBarBg && this.lifeBarFill) {
      const barX = gameSize.width / 2;
      const barY = gameSize.height - 50;
      
      this.lifeBarBg.setPosition(barX, barY);
      this.lifeBarFill.setPosition(barX - this.lifeBarWidth / 2, barY);
      
      // Store updated positions
      this.lifeBarX = barX;
      this.lifeBarY = barY;
    }

    // Force update target scales for device-specific sizing
    this.targets.forEach(target => {
      if (target && target.active) {
        const newScale = this.getDeviceSpecificTargetScale();
        target.setScale(newScale);
      }
    });

    console.log('Scene resize complete');
  }

  initializeLifeSystem() {
    // Get current difficulty config
    const config = this.LIFE_CONFIG[this.currentDifficulty];

    // Initialize life variables
    this.maxLife = config.startingLife;
    this.currentLife = config.startingLife;
    this.gameOver = false;
  }
  initializeDifficultySystem() {
    // Difficulty scaling configuration
    this.difficultyConfig = {
      baseSpawnRate: 1000, // Starting spawn rate (1 second)
      minSpawnRate: 100, // Minimum spawn rate (0.1 seconds)
      hitMilestone: 5, // Hits required per difficulty increase
      spawnRateReduction: 150, // Milliseconds reduced per milestone
      maxDifficultyLevel: 17, // Maximum difficulty level
      exponentialFactor: 1.3, // Exponential scaling factor
      burstSpawnLevel: 5, // Level when burst spawning starts
      maxBurstTargets: 4, // Maximum targets in a burst
      baseTargetLifespan: 3000, // Base target lifespan (3 seconds)
      minTargetLifespan: 800 // Minimum target lifespan (0.8 seconds)
    };

    // Current difficulty state
    this.currentDifficultyLevel = 1;
    this.lastMilestone = 0;
    
    // Initialize target lifespan
    this.targetLifespan = this.difficultyConfig.baseTargetLifespan;

    // Calculate initial spawn rate
    this.updateDifficultyLevel();

    console.log("Difficulty system initialized:", {
      level: this.currentDifficultyLevel,
      spawnRate: this.currentSpawnRate,
      targetLifespan: this.targetLifespan
    });
  }

  updateDifficultyLevel() {
    // Calculate current milestone based on hits
    const currentMilestone = Math.floor(
      this.hits / this.difficultyConfig.hitMilestone
    );

    // Check if we've reached a new milestone
    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;
      this.currentDifficultyLevel = Math.min(
        currentMilestone + 1,
        this.difficultyConfig.maxDifficultyLevel
      );

      // Calculate new spawn rate with exponential scaling
      const exponentialReduction = Math.pow(this.difficultyConfig.exponentialFactor, currentMilestone);
      const linearReduction = currentMilestone * this.difficultyConfig.spawnRateReduction;
      const totalReduction = linearReduction * exponentialReduction;
      
      this.currentSpawnRate = Math.max(
        this.difficultyConfig.minSpawnRate,
        this.difficultyConfig.baseSpawnRate - totalReduction
      );
      
      // Calculate shorter target lifespan
      const lifespanReduction = currentMilestone * 200; // 200ms reduction per level
      this.targetLifespan = Math.max(
        this.difficultyConfig.minTargetLifespan,
        this.difficultyConfig.baseTargetLifespan - lifespanReduction
      );

      // Log difficulty increase
      console.log(
        `Difficulty increased! Level ${this.currentDifficultyLevel}, Spawn rate: ${this.currentSpawnRate}ms, Target lifespan: ${this.targetLifespan}ms`
      );

      // Optional: Add visual feedback for difficulty increase
      this.showDifficultyIncrease(currentMilestone + 1);

      return true; // New difficulty level reached
    }

    return false; // No change
  }

  showDifficultyIncrease() {
    // Create temporary text to show difficulty increase (responsive positioning)
    const difficultyText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, `DIFFICULTY LEVEL ${this.currentDifficultyLevel}`, {
        ...fontStyles.body,
        fill: "#ffff00",
        fontSize: "20px",
      })
      .setOrigin(0.5, 0.5);

    // Animate the text
    this.tweens.add({
      targets: difficultyText,
      alpha: 0,
      y: this.cameras.main.height / 2 - 100,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        difficultyText.destroy();
      },
    });
  }

  createLifeProgressBar() {
    // Progress bar dimensions and position (responsive)
    const barWidth = 300;
    const barHeight = 25;
    const barX = this.cameras.main.width / 2; // Center horizontally
    const barY = this.cameras.main.height - 50; // Bottom margin

    // Create progress bar background
    this.lifeBarBg = this.add.rectangle(
      barX,
      barY,
      barWidth,
      barHeight,
      0x333333
    );
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
      ease: "Power2",
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
    this.targets.forEach((target) => {
      this.removeTarget(target, false);
    });

    // Fade out and transition to GameOver scene
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Pass hits data to GameOver scene
      this.scene.start("GameOver", { hits: this.hits });
    });
  }

  initializeSoundState() {
    // Load sound preference from localStorage
    const savedSoundState = localStorage.getItem("soundEnabled");

    if (savedSoundState !== null) {
      this.soundEnabled = savedSoundState === "true";
    } else {
      // Default to sound enabled
      this.soundEnabled = true;
    }

    "Sound state initialized:", this.soundEnabled;
  }

  createSoundButton() {
    // Create sound button in top-left corner
    this.soundButton = this.add.text(50, 50, this.getSoundButtonText(), {
      ...fontStyles.button,
      fill: this.getSoundButtonColor(),
    });

    // Make button interactive
    this.soundButton.setInteractive();
    this.soundButton.on("pointerdown", () => {
      this.toggleSound();
    });

    // Add hover effects
    this.soundButton.on("pointerover", () => {
      this.soundButton.setScale(1.1);
    });

    this.soundButton.on("pointerout", () => {
      this.soundButton.setScale(1.0);
    });

    ("Sound button created");
  }

  getSoundButtonText() {
    return this.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  }

  getSoundButtonColor() {
    return this.soundEnabled ? "#00ff00" : "#ff0000";
  }

  toggleSound() {
    "Sound button clicked, current state:", this.soundEnabled;

    // If this is the first interaction and audio is locked, unlock it
    if (this.sound.locked) {
      ("Unlocking audio on first interaction");
      this.sound.unlock();
      this.audioUnlocked = true;
    }

    // Toggle sound state
    this.soundEnabled = !this.soundEnabled;

    // Save preference to localStorage
    try {
      localStorage.setItem("soundEnabled", this.soundEnabled.toString());
      "Sound preference saved:", this.soundEnabled;
    } catch (error) {
      console.warn("Could not save sound preference to localStorage:", error);
    }

    // Update button appearance
    this.updateSoundButton();

    // Update audio status display
    this.updateAudioStatus();

    "Sound toggled to:", this.soundEnabled;
  }

  updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.getSoundButtonText());
      this.soundButton.setFill(this.getSoundButtonColor());
    }
  }

  updateAudioStatus() {
    const locked = this.sound.locked;
    const contextState = this.sound.context
      ? this.sound.context.state
      : "unknown";

    // Audio status logging only (no visual display)
    if (locked) {
      ("Audio: LOCKED - Click sound button to unlock");
    } else {
      `Audio: UNLOCKED (${contextState})`;
    }
  }

  setupAudioUnlock() {
    // Handle Chrome autoplay policy
    if (this.sound.locked) {
      ("Audio is locked, waiting for user interaction to unlock");

      // Add one-time unlock listener
      this.input.once("pointerdown", () => {
        ("User interaction detected, attempting to unlock audio");
        this.sound.unlock();
        this.audioUnlocked = true;
        "Audio unlock attempted, locked status:", this.sound.locked;
        this.updateAudioStatus();
      });
    } else {
      ("Audio is already unlocked");
      this.audioUnlocked = true;
      this.updateAudioStatus();
    }
  }

  setupInputSystem() {
    // Configure input for single pointer mode (mobile compatibility)
    this.input.maxPointers = 1;

    // Global background click handler for miss detection
    this.input.on("pointerdown", (pointer) => {
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

    ("Input system configured for single pointer mode");
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
    const target = this.add.sprite(x, y, "ship");
    target.setFrame(0); // Use first frame of ship sprite
    
    // Device-specific target sizing for better mobile experience
    const targetScale = this.getDeviceSpecificTargetScale();
    target.setScale(targetScale);

    // Make target interactive
    target.setInteractive();

    // Add target properties
    target.spawnTime = this.time.now;
    target.isTarget = true;
    target.isBeingDestroyed = false;

    // Add click event listener
    target.on("pointerdown", (pointer, localX, localY, event) => {
      // Stop the event from propagating to the scene's global click handler
      event.stopPropagation();
      this.hitTarget(target);
    });

    // Add to targets array
    this.targets.push(target);

    `Target spawned at (${x}, ${y}). Active targets: ${this.targets.length}`;
    return target;
  }

  getDeviceSpecificTargetScale() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Enhanced device detection with multiple criteria
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // More precise device categorization
    const isPhone = screenWidth <= 768 && (isTouchDevice || /mobile|android|iphone/i.test(userAgent));
    const isTablet = screenWidth > 768 && screenWidth <= 1024 && (isTouchDevice || /tablet|ipad/i.test(userAgent));
    const isDesktop = screenWidth > 1024 && !isTouchDevice;
    
    // Consider both screen size and pixel density for scaling
    let baseScale = 1.0;
    
    if (isPhone) {
      // Smaller targets for phones (reduced from 1.2 to 0.9)
      baseScale = 0.9;
    } else if (isTablet) {
      // Medium targets for tablets (reduced from 1.0 to 0.8)
      baseScale = 0.8;
    } else if (isDesktop) {
      // Smaller targets for desktop precision
      baseScale = 0.7;
    } else {
      // Fallback based on screen width only
      if (screenWidth <= 480) {
        baseScale = 0.85; // Very small screens
      } else if (screenWidth <= 768) {
        baseScale = 0.9;  // Small screens
      } else if (screenWidth <= 1024) {
        baseScale = 0.8;  // Medium screens
      } else {
        baseScale = 0.7;  // Large screens
      }
    }
    
    // Adjust for high DPI displays
    if (devicePixelRatio > 2) {
      baseScale *= 0.9; // Slightly smaller for very high DPI
    } else if (devicePixelRatio > 1.5) {
      baseScale *= 0.95; // Slightly smaller for high DPI
    }
    
    console.log(`Device detection - Width: ${screenWidth}, Touch: ${isTouchDevice}, Scale: ${baseScale}`);
    
    return baseScale;
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
        `Target disappeared! Life: -${config.disappearPenalty}`;
      }

      // Remove event listeners before destroying
      target.removeAllListeners();
      target.destroy();

      `Target removed${wasHit ? " (hit)" : " (timeout)"}. Active targets: ${
        this.targets.length
      }`;
    }
  }

  playManagedSound(soundKey, volume = 1.0) {
    `Attempting to play sound: ${soundKey} at volume ${volume}`;
    "Sound enabled:", this.soundEnabled;
    "Audio locked status:", this.sound.locked;
    "Audio unlocked flag:", this.audioUnlocked;

    // Check if sound is enabled by user
    if (!this.soundEnabled) {
      ("Sound is disabled by user, not playing");
      return null;
    }

    // Check if audio is available
    if (this.sound.locked) {
      console.warn("Audio is locked by browser policy, cannot play sound");
      return null;
    }

    // Check if sound exists
    if (!this.cache.audio.exists(soundKey)) {
      console.error(`Sound '${soundKey}' not found in cache`);
      return null;
    }

    try {
      // Remove finished sounds from active list
      this.activeSounds = this.activeSounds.filter((sound) => sound.isPlaying);

      // If we're at the limit, stop the oldest sound
      if (this.activeSounds.length >= this.maxConcurrentSounds) {
        const oldestSound = this.activeSounds.shift();
        if (oldestSound && oldestSound.isPlaying) {
          oldestSound.stop();
        }
      }

      // Create and play the new sound
      const sound = this.sound.add(soundKey, { volume });
      "Sound object created:", sound;

      // Add event listeners for debugging
      sound.once("play", () => {
        `Sound '${soundKey}' started playing`;
      });

      sound.once("complete", () => {
        `Sound '${soundKey}' finished playing`;
      });

      sound.once("stop", () => {
        `Sound '${soundKey}' was stopped`;
      });

      // Attempt to play
      const playResult = sound.play();
      "Play result:", playResult;

      this.activeSounds.push(sound);
      return sound;
    } catch (error) {
      console.error("Error playing sound:", error);
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
    this.playManagedSound("explosion", 0.7);

    // Increment hits counter
    this.hits++;
    this.updateHitsDisplay();

    // Check for difficulty level increase
    this.updateDifficultyLevel();

    // Add life for hitting target
    const config = this.LIFE_CONFIG[this.currentDifficulty];
    this.addLife(config.hitBonus);

    // Create explosion at target position
    const explosion = this.add.sprite(target.x, target.y, "explosion");
    explosion.setScale(0.8); // Adjust size as needed

    "Explosion sprite created at:", target.x, target.y;
    "Explosion sprite visible:", explosion.visible;
    ("Playing explosion animation...");

    explosion.play("explode");

    // Remove explosion when animation completes
    explosion.on("animationcomplete", () => {
      ("Explosion animation completed");
      explosion.destroy();
    });

    // Add fallback removal in case animation doesn't complete
    this.time.delayedCall(500, () => {
      if (explosion && explosion.active) {
        ("Fallback: destroying explosion sprite");
        explosion.destroy();
      }
    });

    // Remove target with slight delay to let explosion start
    this.time.delayedCall(50, () => {
      this.removeTarget(target, true);
    });

    `Target hit! Hits: ${this.hits}, Life: +${config.hitBonus} - Explosion sound played`;
  }

  handleMiss(pointer) {
    // Play click sound for miss
    this.playManagedSound("click", 0.5);

    // Remove life for missing
    const config = this.LIFE_CONFIG[this.currentDifficulty];
    this.removeLife(config.missPenalty);

    `Miss! Life: -${config.missPenalty} - Click sound played`;

    // Optional: Add visual feedback for miss
    // Could add a brief red flash or miss indicator here
  }

  updateHitsDisplay() {
    this.hitsText.setText(`Hits: ${this.hits}`);
  }

  updateSpawnRate() {
    // Progressive difficulty: reduce spawn rate over time
    const elapsedTime = this.time.now - this.gameStartTime;
    const difficultyFactor = Math.floor(elapsedTime / 5000); // Every 5 seconds

    this.currentSpawnRate = Math.max(
      this.minSpawnRate,
      this.initialSpawnRate - difficultyFactor * 50
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
      // Determine if we should do burst spawning
      const shouldBurstSpawn = this.currentDifficultyLevel >= this.difficultyConfig.burstSpawnLevel;
      
      if (shouldBurstSpawn) {
        // Calculate number of targets to spawn in burst
        const burstSize = Math.min(
          Math.floor(this.currentDifficultyLevel / 3) + 1,
          this.difficultyConfig.maxBurstTargets
        );
        
        // Spawn multiple targets with slight delays
        for (let i = 0; i < burstSize; i++) {
          this.time.delayedCall(i * 100, () => {
            this.createTarget();
          });
        }
      } else {
        // Normal single target spawning
        this.createTarget();
      }
      
      this.lastSpawnTime = currentTime;
    }

    // Check for expired targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      if (
        !target.isBeingDestroyed &&
        currentTime - target.spawnTime > this.targetLifespan
      ) {
        this.removeTarget(target, false);
      }
    }
  }

  showDifficultyIncrease(newLevel) {
    // Create difficulty increase notification
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const difficultyText = this.add
      .text(centerX, centerY - 50, `DIFFICULTY INCREASED!\nLevel ${newLevel}`, {
        fontSize: "32px",
        fontFamily: "Arial",
        fill: "#ff4444",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Add pulsing animation
    this.tweens.add({
      targets: difficultyText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: "Power2",
    });

    // Fade out after animation
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: difficultyText,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          difficultyText.destroy();
        },
      });
    });

    // Screen flash effect
    const flashOverlay = this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0xff4444,
      0.3
    );

    this.tweens.add({
      targets: flashOverlay,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flashOverlay.destroy();
      },
    });
  }
}
