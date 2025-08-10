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

  update(time, delta) {
    // Game over check
    if (this.gameOver) return;

    // Check if it's time to spawn a new target
    if (time - this.lastSpawnTime > this.currentSpawnRate && this.targets.length < this.maxTargets) {
      this.spawnTarget();
      this.lastSpawnTime = time;
    }

    // Update difficulty based on hits
    this.updateDifficultyLevel();
  }

  getDeviceSpecificTargetScale() {
    const screenWidth = this.cameras.main.width;
    const isMobile = screenWidth <= 768 || (this.input.activePointer && this.input.activePointer.wasTouch);
    const isTablet = screenWidth > 768 && screenWidth <= 1024;

    if (isMobile) return 0.8; // Smaller targets for mobile
    else if (isTablet) return 1.0;
    else return 0.8;
  }

  spawnTarget() {
    const targetX = Phaser.Math.Between(this.spawnBounds.minX, this.spawnBounds.maxX);
    const targetY = Phaser.Math.Between(this.spawnBounds.minY, this.spawnBounds.maxY);

    const target = this.add.sprite(targetX, targetY, "ship");
    target.setScale(this.getDeviceSpecificTargetScale());
    target.setInteractive();

    target.on("pointerdown", () => {
      this.handleHit(target);
    });

    this.targets.push(target);

    // Add a timer to remove the target if it's not clicked
    target.lifespanTimer = this.time.addEvent({
      delay: this.targetLifespan,
      callback: () => {
        this.removeTarget(target, true);
      },
      callbackScope: this,
    });
  }

  handleHit(target) {
    this.hits++;
    this.hitsText.setText(`Hits: ${this.hits}`);

    // Add life on hit
    this.addLife(this.LIFE_CONFIG[this.currentDifficulty].hitBonus);

    // Play explosion animation
    const explosion = this.add.sprite(target.x, target.y, "explosion");
    explosion.setScale(this.getDeviceSpecificTargetScale());
    explosion.play("explode");
    explosion.on('animationcomplete', () => {
      explosion.destroy();
    });

    // Play click sound
    this.playSound("click");

    // Remove target
    this.removeTarget(target, false);
  }

  removeTarget(target, missed) {
    if (!target || !target.active) return;

    // Stop the lifespan timer
    if (target.lifespanTimer) {
      target.lifespanTimer.remove();
    }

    // Remove from targets array
    const index = this.targets.indexOf(target);
    if (index > -1) {
      this.targets.splice(index, 1);
    }

    // Destroy the target sprite
    target.destroy();

    if (missed) {
      this.removeLife(this.LIFE_CONFIG[this.currentDifficulty].disappearPenalty);
    }
  }

  playSound(key) {
    if (this.soundEnabled && !this.sound.locked) {
      if (this.activeSounds.length < this.maxConcurrentSounds) {
        const sound = this.sound.add(key);
        sound.play();
        this.activeSounds.push(sound);
        sound.once("complete", () => {
          const index = this.activeSounds.indexOf(sound);
          if (index > -1) {
            this.activeSounds.splice(index, 1);
          }
        });
      }
    }
  }

  setupInputSystem() {
    this.input.on("pointerdown", (pointer) => {
      let targetClicked = false;
      this.targets.forEach((target) => {
        if (target.getBounds().contains(pointer.x, pointer.y)) {
          targetClicked = true;
        }
      });

      if (!targetClicked) {
        this.removeLife(this.LIFE_CONFIG[this.currentDifficulty].missPenalty);
      }
    });
  }

  setupAudioUnlock() {
    this.input.once("pointerdown", () => {
      if (this.sound.locked) {
        this.sound.unlock();
        this.audioUnlocked = true;
      }
    });
  }

  updateSpawnBounds() {
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
    if (this.background) {
      this.background.setDisplaySize(gameSize.width, gameSize.height);
    }

    this.updateSpawnBounds();

    if (this.hitsText) {
      this.hitsText.setPosition(gameSize.width - 50, 50);
    }

    if (this.soundButton) {
      this.soundButton.setPosition(50, 50);
    }

    if (this.lifeBarBg && this.lifeBarFill) {
      const barX = gameSize.width / 2;
      const barY = gameSize.height - 50;

      this.lifeBarBg.setPosition(barX, barY);
      this.lifeBarFill.setPosition(barX - this.lifeBarWidth / 2, barY);

      this.lifeBarX = barX;
      this.lifeBarY = barY;
    }

    this.targets.forEach(target => {
      if (target && target.active) {
        const newScale = this.getDeviceSpecificTargetScale();
        target.setScale(newScale);
      }
    });
  }

  initializeLifeSystem() {
    const config = this.LIFE_CONFIG[this.currentDifficulty];
    this.maxLife = config.startingLife;
    this.currentLife = config.startingLife;
    this.gameOver = false;
  }

  initializeDifficultySystem() {
    this.difficultyConfig = {
      baseSpawnRate: 1000,
      minSpawnRate: 100,
      hitMilestone: 5,
      spawnRateReduction: 150,
      maxDifficultyLevel: 17,
      exponentialFactor: 1.3,
      burstSpawnLevel: 5,
      maxBurstTargets: 4,
      baseTargetLifespan: 3000,
      minTargetLifespan: 800
    };

    this.currentDifficultyLevel = 1;
    this.lastMilestone = 0;
    this.targetLifespan = this.difficultyConfig.baseTargetLifespan;
    this.updateDifficultyLevel();
  }

  updateDifficultyLevel() {
    const currentMilestone = Math.floor(
      this.hits / this.difficultyConfig.hitMilestone
    );

    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;
      this.currentDifficultyLevel = Math.min(
        currentMilestone + 1,
        this.difficultyConfig.maxDifficultyLevel
      );

      const exponentialReduction = Math.pow(this.difficultyConfig.exponentialFactor, currentMilestone);
      const linearReduction = currentMilestone * this.difficultyConfig.spawnRateReduction;
      const totalReduction = linearReduction * exponentialReduction;

      this.currentSpawnRate = Math.max(
        this.difficultyConfig.minSpawnRate,
        this.difficultyConfig.baseSpawnrate - totalReduction
      );

      const lifespanReduction = currentMilestone * 200;
      this.targetLifespan = Math.max(
        this.difficultyConfig.minTargetLifespan,
        this.difficultyConfig.baseTargetLifespan - lifespanReduction
      );

      this.showDifficultyIncrease();

      return true;
    }

    return false;
  }

  showDifficultyIncrease() {
    const difficultyText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, `DIFFICULTY LEVEL ${this.currentDifficultyLevel}`, {
        ...fontStyles.body,
        fill: "#ffff00",
        fontSize: "20px",
      })
      .setOrigin(0.5, 0.5);

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
    const barWidth = 300;
    const barHeight = 25;
    const barX = this.cameras.main.width / 2;
    const barY = this.cameras.main.height - 50;

    this.lifeBarBg = this.add.rectangle(
      barX,
      barY,
      barWidth,
      barHeight,
      0x333333
    );
    this.lifeBarBg.setStrokeStyle(2, 0xffffff);

    this.lifeBarFill = this.add.rectangle(
      barX - barWidth / 2,
      barY,
      barWidth,
      barHeight,
      0x00ff00
    );
    this.lifeBarFill.setOrigin(0, 0.5);

    this.lifeBarWidth = barWidth;
    this.lifeBarHeight = barHeight;
    this.lifeBarX = barX;
    this.lifeBarY = barY;
  }

  updateLifeDisplay() {
    if (!this.lifeBarFill) return;

    const lifePercentage = Math.max(0, this.currentLife / this.maxLife);

    this.tweens.killTweensOf(this.lifeBarFill);

    this.lifeBarFill.scaleX = lifePercentage;

    this.tweens.add({
      targets: this.lifeBarFill,
      scaleX: lifePercentage,
      duration: 300,
      ease: "Power2",
    });

    let barColor = 0x00ff00;
    if (lifePercentage <= 0.2) {
      barColor = 0xff0000;
    } else if (lifePercentage <= 0.5) {
      barColor = 0xffff00;
    }

    this.lifeBarFill.setFillStyle(barColor);
  }

  addLife(amount) {
    if (this.gameOver) return;

    const newLife = this.currentLife + amount;
    this.currentLife = Math.min(this.maxLife, newLife);
    this.updateLifeDisplay();
  }

  removeLife(amount) {
    if (this.gameOver) return;

    this.currentLife = Math.max(0, this.currentLife - amount);
    this.updateLifeDisplay();

    if (this.currentLife <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;

    this.gameOver = true;

    this.targets.forEach((target) => {
      this.removeTarget(target, false);
    });

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameOver", { hits: this.hits });
    });
  }

  initializeSoundState() {
    const savedSoundState = localStorage.getItem("soundEnabled");
    this.soundEnabled = savedSoundState !== null ? savedSoundState === "true" : true;
  }

  createSoundButton() {
    this.soundButton = this.add.text(50, 50, this.getSoundButtonText(), {
      ...fontStyles.button,
      fill: this.getSoundButtonColor(),
    });

    this.soundButton.setInteractive();
    this.soundButton.on("pointerdown", () => this.toggleSound());
    this.soundButton.on("pointerover", () => this.soundButton.setScale(1.1));
    this.soundButton.on("pointerout", () => this.soundButton.setScale(1.0));
  }

  getSoundButtonText() {
    return this.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  }

  getSoundButtonColor() {
    return this.soundEnabled ? "#00ff00" : "#ff0000";
  }

  toggleSound() {
    if (this.sound.locked) {
      this.sound.unlock();
      this.audioUnlocked = true;
    }

    this.soundEnabled = !this.soundEnabled;

    try {
      localStorage.setItem("soundEnabled", this.soundEnabled.toString());
    } catch (error) {
      console.warn("Could not save sound preference to localStorage:", error);
    }

    this.updateSoundButton();
    this.updateAudioStatus();
  }

  updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.getSoundButtonText());
      this.soundButton.setFill(this.getSoundButtonColor());
    }
  }

  updateAudioStatus() {
    const locked = this.sound.locked;
    const contextState = this.sound.context ? this.sound.context.state : "unknown";

    if (locked) {
      // No visual display, just log
    } else {
      // No visual display, just log
    }
  }
}
