export class FullscreenManager {
  constructor(scene) {
    this.scene = scene;
    this.fullscreenButton = null;
  }

  preloadAssets() {
    // Load fullscreen sprites
    this.scene.load.image('fullscreen', 'assets/fullscreen.png');
    this.scene.load.image('exit_fullscreen', 'assets/exit_fullscreen.png');
  }

  createFullscreenButton(x, y) {
    // Create the fullscreen button sprite - start with regular fullscreen icon
    const initialTexture = this.scene.scale.isFullscreen ? 'exit_fullscreen' : 'fullscreen';
    this.fullscreenButton = this.scene.add.sprite(x, y, initialTexture);
    
    // Set appropriate scale based on device type
    const scale = this.getDeviceSpecificScale();
    this.fullscreenButton.setScale(scale);
    
    // Make it interactive
    this.fullscreenButton.setInteractive();
    this.fullscreenButton.setOrigin(1, 1); // Align to bottom-right corner
    
    // Add pointer events - Use pointerup instead of pointerdown for better fullscreen API compatibility
    this.fullscreenButton.on('pointerup', (pointer, localX, localY, event) => {
      // Stop event propagation to ensure this is treated as a direct user gesture
      event.stopPropagation();
      this.toggleFullscreen();
    });

    // Add hover effects
    this.fullscreenButton.on('pointerover', () => {
      this.fullscreenButton.setScale(scale * 1.1);
      this.fullscreenButton.setTint(0xdddddd);
    });

    this.fullscreenButton.on('pointerout', () => {
      this.fullscreenButton.setScale(scale);
      this.fullscreenButton.clearTint();
    });

    // Listen for fullscreen changes from both Phaser and browser
    this.scene.scale.on('fullscreenchange', this.onFullscreenChange, this);
    
    // Also listen for browser fullscreen events
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));

    return this.fullscreenButton;
  }

  getDeviceSpecificScale() {
    const screenWidth = this.scene.cameras.main.width;
    const isMobile = screenWidth <= 768 || 
      (this.scene.input.activePointer && this.scene.input.activePointer.wasTouch);
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    
    if (isMobile) return 0.5;      // Much smaller for mobile
    else if (isTablet) return 0.6; // Medium size for tablets
    else return 0.7;               // Normal size for desktop
  }

  toggleFullscreen() {
    try {
      if (this.scene.scale.isFullscreen) {
        this.scene.scale.stopFullscreen();
      } else {
        this.scene.scale.startFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen API error:', error);
      // Fallback: try direct browser fullscreen API
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Direct fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen().catch(err => {
          console.warn('Direct fullscreen exit failed:', err);
        });
      }
    }
  }

  onFullscreenChange() {
    if (!this.fullscreenButton) return;

    // Check both Phaser's fullscreen state and browser's fullscreen state
    const isFullscreen = this.scene.scale.isFullscreen || 
                        document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement;

    // Update sprite based on fullscreen state - CORRECTED LOGIC
    const newTexture = isFullscreen ? 'exit_fullscreen' : 'fullscreen';
    this.fullscreenButton.setTexture(newTexture);
    
    // Update scale for current device
    const scale = this.getDeviceSpecificScale();
    this.fullscreenButton.setScale(scale);
  }

  updatePosition(x, y) {
    if (this.fullscreenButton) {
      this.fullscreenButton.setPosition(x, y);
    }
  }

  handleResize() {
    if (this.fullscreenButton) {
      // Update scale when screen size changes
      const scale = this.getDeviceSpecificScale();
      this.fullscreenButton.setScale(scale);
    }
  }

  destroy() {
    if (this.fullscreenButton) {
      this.scene.scale.off('fullscreenchange', this.onFullscreenChange, this);
      
      // Remove browser fullscreen event listeners
      document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
      document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
      document.removeEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
      document.removeEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));
      
      this.fullscreenButton.destroy();
      this.fullscreenButton = null;
    }
  }
}