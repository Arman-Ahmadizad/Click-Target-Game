import { fontStyles } from "../fontStyles.js";
import { FullscreenManager } from "../utils/FullscreenManager.js";

export class Start extends Phaser.Scene {
  constructor() {
    super("Start");
    this.fullscreenManager = new FullscreenManager(this);
  }

  preload() {
    this.load.image("background-start", "assets/space.png");
    this.fullscreenManager.preloadAssets();
  }

  create() {
    this.background = this.add.image(0, 0, "background-start").setOrigin(0, 0);

    this.titleText = this.add.text(0, 0, "CLICK TARGET GAME", {
        ...fontStyles.title,
        fill: "#ffffff",
      }).setOrigin(0.5, 0.5);

    this.instructionsText1 = this.add.text(0, 0, "Click targets to survive", {
        ...fontStyles.body,
        fill: "#ffffff",
      }).setOrigin(0.5, 0.5);

    this.instructionsText2 = this.add.text(0, 0, "Game gets harder over time", {
        ...fontStyles.body,
        fill: "#ffffff",
      }).setOrigin(0.5, 0.5);

    this.startButton = this.add.text(0, 0, "TAP TO START", {
        ...fontStyles.button,
        fill: "#00ff00",
      }).setOrigin(0.5, 0.5);

    this.startButton.setInteractive();
    this.startButton.on("pointerdown", () => this.startGame());
    this.startButton.on("pointerover", () => {
      this.startButton.setScale(1.1).setFill("#ffffff");
    });
    this.startButton.on("pointerout", () => {
      this.startButton.setScale(1.0).setFill("#00ff00");
    });

    this.initializeSoundState();
    this.createSoundButton();

    // Create fullscreen button using the manager
    this.fullscreenButton = this.fullscreenManager.createFullscreenButton(this.cameras.main.width - 50, this.cameras.main.height - 50);

    this.scale.on('resize', this.resize, this);
    this.resize({ width: this.cameras.main.width, height: this.cameras.main.height });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  resize(gameSize) {
    const { width, height } = gameSize;

    this.background.setDisplaySize(width, height);

    this.titleText.setPosition(width / 2, height * 0.25);
    this.instructionsText1.setPosition(width / 2, height * 0.4);
    this.instructionsText2.setPosition(width / 2, height * 0.45);
    this.startButton.setPosition(width / 2, height * 0.65);
    if (this.soundButton) {
      this.soundButton.setPosition(50, 50);
      const scale = this.getDeviceSpecificButtonScale();
      this.soundButton.setScale(scale);
    }
    if (this.fullscreenButton) {
      this.fullscreenManager.updatePosition(width - 50, height - 50);
      this.fullscreenManager.handleResize();
    }
  }

  startGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Gameplay");
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

    // Set device-specific scale
    const scale = this.getDeviceSpecificButtonScale();
    this.soundButton.setScale(scale);

    this.soundButton.setInteractive();
    this.soundButton.on("pointerdown", () => this.toggleSound());
    this.soundButton.on("pointerover", () => this.soundButton.setScale(scale * 1.1));
    this.soundButton.on("pointerout", () => this.soundButton.setScale(scale));
  }

  getDeviceSpecificButtonScale() {
    // Add null checks for camera during fullscreen transitions
    if (!this.cameras || !this.cameras.main) {
      return 1.0; // Default scale if camera is not available
    }
    
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
    if (this.sound.locked) {
      this.sound.unlock();
    }
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem("soundEnabled", this.soundEnabled.toString());
    } catch (error) {
      console.warn("Could not save sound preference to localStorage:", error);
    }
    this.updateSoundButton();
  }

  updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.getSoundButtonText());
      this.soundButton.setFill(this.getSoundButtonColor());
    }
  }
}
