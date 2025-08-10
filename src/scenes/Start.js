import { fontStyles } from "../fontStyles.js";

export class Start extends Phaser.Scene {
  constructor() {
    super("Start");
  }

  preload() {
    this.load.image("background-start", "assets/space.png");
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

    this.fullscreenButton = this.add.text(0, 0, "FULLSCREEN", {
        ...fontStyles.button,
        fill: "#ffffff",
      }).setOrigin(1, 0);

    this.fullscreenButton.setInteractive();
    this.fullscreenButton.on("pointerup", () => {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    });

    this.scale.on('fullscreenchange', (isFullscreen) => {
        if (isFullscreen) {
            this.fullscreenButton.setText("EXIT FULLSCREEN");
        } else {
            this.fullscreenButton.setText("FULLSCREEN");
        }
    });

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
    this.soundButton.setPosition(50, 50);
    if (this.fullscreenButton) {
        this.fullscreenButton.setPosition(width - 50, 50);
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
