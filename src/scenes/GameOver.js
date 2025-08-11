import { fontStyles } from "../fontStyles.js";
import { FullscreenManager } from "../utils/FullscreenManager.js";

export class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
    this.fullscreenManager = new FullscreenManager(this);
  }

  init(data) {
    // Receive data from Gameplay scene
    this.finalHits = data.hits || 0;
  }

  preload() {
    // Load simple background
    this.load.image("background-gameover", "assets/space.png");
    // Load fullscreen assets
    this.fullscreenManager.preloadAssets();
  }

  create() {
    // Add static background (responsive)
    this.background = this.add.image(0, 0, "background-gameover");
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    // Initialize sound state and create sound button
    this.initializeSoundState();
    this.createSoundButton();

    // Create fullscreen button
    this.fullscreenButton = this.fullscreenManager.createFullscreenButton(this.cameras.main.width - 50, this.cameras.main.height - 50);

    // Load and check personal best
    this.personalBest = this.loadPersonalBest();
    this.isNewRecord = this.checkNewRecord(this.finalHits);

    // Add game over title (responsive center)
    this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height * 0.25, "GAME OVER", {
        ...fontStyles.title,
        fill: "#ff0000",
      })
      .setOrigin(0.5, 0.5);

    // Add current hits display (responsive center)
    this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height * 0.4, `HITS: ${this.finalHits}`, {
        ...fontStyles.body,
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Add personal best display (responsive center)
    this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height * 0.45, `PERSONAL BEST: ${this.personalBest}`, {
        ...fontStyles.body,
        fill: "#ffff00",
      })
      .setOrigin(0.5, 0.5);

    // Add new record indicator if applicable (responsive center)
    if (this.isNewRecord) {
      this.add
        .text(this.cameras.main.width / 2, this.cameras.main.height * 0.5, "NEW RECORD!", {
          ...fontStyles.body,
          fill: "#00ff00",
        })
        .setOrigin(0.5, 0.5);
    }

    // Add play again button (responsive center)
    this.playAgainButton = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height * 0.65, "PLAY AGAIN", {
        ...fontStyles.button,
        fill: "#00ff00",
      })
      .setOrigin(0.5, 0.5);

    // Make play again button interactive
    this.playAgainButton.setInteractive();
    this.playAgainButton.on("pointerdown", () => {
      this.restartGame();
    });

    // Add hover effects to play again button
    this.playAgainButton.on("pointerover", () => {
      this.playAgainButton.setScale(1.1);
      this.playAgainButton.setFill("#ffffff");
    });

    this.playAgainButton.on("pointerout", () => {
      this.playAgainButton.setScale(1.0);
      this.playAgainButton.setFill("#00ff00");
    });

    // Add back to menu button (responsive center)
    this.menuButton = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height * 0.75, "MAIN MENU", {
        ...fontStyles.button,
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Make menu button interactive
    this.menuButton.setInteractive();
    this.menuButton.on("pointerdown", () => {
      this.goToMenu();
    });

    // Add hover effects to menu button
    this.menuButton.on("pointerover", () => {
      this.menuButton.setScale(1.1);
      this.menuButton.setFill("#00ff00");
    });

    this.menuButton.on("pointerout", () => {
      this.menuButton.setScale(1.0);
      this.menuButton.setFill("#ffffff");
    });

    // Fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Handle resize events
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize) {
    if (this.background) {
      this.background.setDisplaySize(gameSize.width, gameSize.height);
    }

    if (this.soundButton) {
      this.soundButton.setPosition(50, 50);
      const scale = this.getDeviceSpecificButtonScale();
      this.soundButton.setScale(scale);
    }

    if (this.fullscreenButton) {
      this.fullscreenManager.updatePosition(gameSize.width - 50, gameSize.height - 50);
      this.fullscreenManager.handleResize();
    }
  }

  loadPersonalBest() {
    return parseInt(localStorage.getItem("clickTargetPersonalBest")) || 0;
  }

  checkNewRecord(hits) {
    if (hits > this.personalBest) {
      localStorage.setItem("clickTargetPersonalBest", hits.toString());
      return true;
    }
    return false;
  }

  restartGame() {
    // Fade out effect before transitioning
    this.cameras.main.fadeOut(500, 0, 0, 0);

    // Start gameplay scene after fade completes
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Gameplay");
    });
  }

  goToMenu() {
    // Fade out effect before transitioning
    this.cameras.main.fadeOut(500, 0, 0, 0);

    // Start start scene after fade completes
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Start");
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

    "Sound state initialized in GameOver scene:", this.soundEnabled;
  }

  createSoundButton() {
    // Create sound button in top-left corner
    this.soundButton = this.add.text(50, 50, this.getSoundButtonText(), {
      ...fontStyles.button,
      fill: this.getSoundButtonColor(),
    });

    // Set device-specific scale
    const scale = this.getDeviceSpecificButtonScale();
    this.soundButton.setScale(scale);

    // Make button interactive
    this.soundButton.setInteractive();
    this.soundButton.on("pointerdown", () => {
      this.toggleSound();
    });

    // Add hover effects
    this.soundButton.on("pointerover", () => {
      this.soundButton.setScale(scale * 1.1);
    });

    this.soundButton.on("pointerout", () => {
      this.soundButton.setScale(scale);
    });

    ("Sound button created in GameOver scene");
  }

  getDeviceSpecificButtonScale() {
    const screenWidth = this.cameras.main.width;
    const isMobile = screenWidth <= 768 || 
      (this.input.activePointer && this.input.activePointer.wasTouch);
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    
    if (isMobile) return 0.7;      // Smaller for mobile
    else if (isTablet) return 0.8; // Medium size for tablets
    else return 1.0;               // Normal size for desktop
  }

  getSoundButtonText() {
    return this.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  }

  getSoundButtonColor() {
    return this.soundEnabled ? "#00ff00" : "#ff0000";
  }

  toggleSound() {
    "Sound button clicked in GameOver scene, current state:", this.soundEnabled;

    // Toggle sound state
    this.soundEnabled = !this.soundEnabled;

    // Save preference to localStorage
    try {
      localStorage.setItem("soundEnabled", this.soundEnabled.toString());
      "Sound preference saved from GameOver scene:", this.soundEnabled;
    } catch (error) {
      console.warn("Could not save sound preference to localStorage:", error);
    }

    // Update button appearance
    this.updateSoundButton();

    "Sound toggled to in GameOver scene:", this.soundEnabled;
  }

  updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.getSoundButtonText());
      this.soundButton.setFill(this.getSoundButtonColor());
    }
  }
}
