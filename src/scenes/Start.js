import { fontStyles } from "../fontStyles.js";

export class Start extends Phaser.Scene {
  constructor() {
    super("Start");
  }

  preload() {
    // Load simple background
    this.load.image("background-start", "assets/space.png");
  }

  create() {
    // Add static background
    this.background = this.add.image(640, 360, "background-start");
    this.background.setDisplaySize(1280, 720);

    // Add game title
    this.add
      .text(640, 200, "CLICK TARGET GAME", {
        ...fontStyles.title,
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Add game instructions
    this.add
      .text(640, 300, "Click targets to survive", {
        ...fontStyles.body,
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(640, 340, "Game gets harder over time", {
        ...fontStyles.body,
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Add start button
    this.startButton = this.add
      .text(640, 450, "TAP TO START", {
        ...fontStyles.button,
        fill: "#00ff00",
      })
      .setOrigin(0.5, 0.5);

    // Make start button interactive
    this.startButton.setInteractive();
    this.startButton.on("pointerdown", () => {
      this.startGame();
    });

    // Add hover effects to start button
    this.startButton.on("pointerover", () => {
      this.startButton.setScale(1.1);
      this.startButton.setFill("#ffffff");
    });

    this.startButton.on("pointerout", () => {
      this.startButton.setScale(1.0);
      this.startButton.setFill("#00ff00");
    });

    // Initialize sound state and create sound button
    this.initializeSoundState();
    this.createSoundButton();

    // Fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  startGame() {
    // Fade out effect before transitioning
    this.cameras.main.fadeOut(500, 0, 0, 0);

    // Start gameplay scene after fade completes
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Gameplay");
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

    "Sound state initialized in Start scene:", this.soundEnabled;
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

    ("Sound button created in Start scene");
  }

  getSoundButtonText() {
    return this.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  }

  getSoundButtonColor() {
    return this.soundEnabled ? "#00ff00" : "#ff0000";
  }

  toggleSound() {
    "Sound button clicked in Start scene, current state:", this.soundEnabled;

    // If this is the first interaction and audio is locked, unlock it
    if (this.sound.locked) {
      ("Unlocking audio on first interaction in Start scene");
      this.sound.unlock();
    }

    // Toggle sound state
    this.soundEnabled = !this.soundEnabled;

    // Save preference to localStorage
    try {
      localStorage.setItem("soundEnabled", this.soundEnabled.toString());
      "Sound preference saved from Start scene:", this.soundEnabled;
    } catch (error) {
      console.warn("Could not save sound preference to localStorage:", error);
    }

    // Update button appearance
    this.updateSoundButton();

    "Sound toggled to in Start scene:", this.soundEnabled;
  }

  updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.getSoundButtonText());
      this.soundButton.setFill(this.getSoundButtonColor());
    }
  }
}
