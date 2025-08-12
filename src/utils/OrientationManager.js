export class OrientationManager {
  constructor() {
    this.portraitWarning = null;
    this.gameContainer = null;
    this.isInitialized = false;
    this.checkInterval = null;
  }

  initialize() {
    if (this.isInitialized) return;

    this.portraitWarning = document.getElementById('portrait-warning');
    this.gameContainer = document.getElementById('game-container');
    
    if (!this.portraitWarning || !this.gameContainer) {
      console.warn('OrientationManager: Required DOM elements not found');
      return;
    }

    this.setupOrientationDetection();
    this.isInitialized = true;
  }

  setupOrientationDetection() {
    // Check orientation immediately
    this.checkOrientation();

    // Set up multiple event listeners for different scenarios
    window.addEventListener('orientationchange', () => {
      // Multiple timeouts to handle different browser behaviors
      setTimeout(() => this.checkOrientation(), 100);
      setTimeout(() => this.checkOrientation(), 300);
      setTimeout(() => this.checkOrientation(), 500);
      setTimeout(() => this.checkOrientation(), 1000);
      setTimeout(() => this.checkOrientation(), 1500); // Extra timeout for stubborn cases
    });

    window.addEventListener('resize', () => {
      // Debounced resize check
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.checkOrientation();
      }, 200);
      
      // Also immediate check for faster response
      this.checkOrientation();
    });

    // Modern Screen Orientation API
    if (screen && screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.checkOrientation(), 100);
        setTimeout(() => this.checkOrientation(), 500);
      });
    }

    // Visual viewport changes (important for mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        setTimeout(() => this.checkOrientation(), 100);
      });
    }

    // Continuous monitoring for fullscreen mode (where events might not fire reliably)
    this.startContinuousMonitoring();

    // Listen for fullscreen changes to adjust monitoring strategy
    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
      this.adjustMonitoringStrategy();
    });

    document.addEventListener('webkitfullscreenchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
      this.adjustMonitoringStrategy();
    });

    document.addEventListener('mozfullscreenchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
      this.adjustMonitoringStrategy();
    });
  }

  checkOrientation() {
    if (!this.isInitialized) return;

    const isPortrait = this.detectPortraitOrientation();
    const isMobileDevice = this.isMobileDevice();
    
    // Only show warning on mobile/tablet devices in portrait mode
    if (isMobileDevice && isPortrait) {
      this.showPortraitWarning();
    } else {
      this.hidePortraitWarning();
    }
  }

  detectPortraitOrientation() {
    // Multiple methods to detect portrait orientation
    // Method 1: Window dimensions
    const windowRatio = window.innerWidth / window.innerHeight;
    const isPortraitByDimensions = windowRatio < 1;

    // Method 2: Screen orientation API
    let isPortraitByAPI = false;
    if (screen && screen.orientation) {
      const angle = screen.orientation.angle;
      isPortraitByAPI = angle === 0 || angle === 180;
    }

    // Method 3: Legacy orientation property
    let isPortraitByLegacy = false;
    if (typeof window.orientation !== 'undefined') {
      const orientation = window.orientation;
      isPortraitByLegacy = orientation === 0 || orientation === 180;
    }

    // Method 4: Visual viewport (for fullscreen)
    let isPortraitByViewport = false;
    if (window.visualViewport) {
      isPortraitByViewport = window.visualViewport.width < window.visualViewport.height;
    }

    // Use the most reliable method available
    // In fullscreen, dimensions are most reliable
    if (this.isFullscreen()) {
      return isPortraitByViewport || isPortraitByDimensions;
    } else {
      // Outside fullscreen, prioritize API methods but use dimensions as fallback
      // If API methods are available and agree, use them
      if (screen.orientation || typeof window.orientation !== 'undefined') {
        // Use API result if available
        const apiResult = isPortraitByAPI || isPortraitByLegacy;
        // But also check if dimensions strongly disagree (safety check)
        if (Math.abs(windowRatio - 1) > 0.3) { // Clear portrait/landscape distinction
          return apiResult;
        }
      }
      // Fall back to dimensions method
      return isPortraitByDimensions;
    }
  }

  isMobileDevice() {
    // Enhanced mobile detection
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = Math.max(window.innerWidth, window.innerHeight);
    
    // Check user agent
    const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Check screen size (tablets up to 1024px)
    const isMobileScreen = screenWidth <= 1024;
    
    // Check touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileScreen && hasTouch);
  }

  isFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement || 
              document.msFullscreenElement);
  }

  showPortraitWarning() {
    if (this.portraitWarning && !this.portraitWarning.classList.contains('show')) {
      this.portraitWarning.classList.add('show');
      this.portraitWarning.style.display = 'flex'; // Force display
      this.portraitWarning.style.zIndex = '99999'; // Force z-index
      
      // In fullscreen mode, also append to the fullscreen element
      if (this.isFullscreen()) {
        const fullscreenElement = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement;
        
        if (fullscreenElement && !fullscreenElement.contains(this.portraitWarning)) {
          // Create a clone of the warning for fullscreen
          const fullscreenWarning = this.portraitWarning.cloneNode(true);
          fullscreenWarning.id = 'fullscreen-portrait-warning';
          fullscreenWarning.style.position = 'absolute';
          fullscreenWarning.style.display = 'flex';
          fullscreenWarning.style.zIndex = '99999';
          fullscreenElement.appendChild(fullscreenWarning);
        }
      }
      
      if (this.gameContainer) {
        this.gameContainer.style.filter = 'blur(3px)';
        this.gameContainer.style.pointerEvents = 'none';
      }
    }
  }

  hidePortraitWarning() {
    if (this.portraitWarning) {
      if (this.portraitWarning.classList.contains('show')) {
        this.portraitWarning.classList.remove('show');
        
        // Force hide with inline styles as backup
        this.portraitWarning.style.display = 'none';
        
        // Remove fullscreen clone if it exists
        const fullscreenWarning = document.getElementById('fullscreen-portrait-warning');
        if (fullscreenWarning) {
          fullscreenWarning.remove();
        }
        
        if (this.gameContainer) {
          this.gameContainer.style.filter = 'none';
          this.gameContainer.style.pointerEvents = 'auto';
        }
      } else {
        // Force hide even if class isn't there
        this.portraitWarning.style.display = 'none';
        if (this.gameContainer) {
          this.gameContainer.style.filter = 'none';
          this.gameContainer.style.pointerEvents = 'auto';
        }
      }
    }
  }

  startContinuousMonitoring() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Start monitoring every 500ms (more frequent in fullscreen)
    this.checkInterval = setInterval(() => {
      this.checkOrientation();
    }, 500);
  }

  adjustMonitoringStrategy() {
    // Increase monitoring frequency in fullscreen mode
    if (this.isFullscreen()) {
      this.startContinuousMonitoring();
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.isInitialized = false;
  }
}

// Create and export a singleton instance
export const orientationManager = new OrientationManager();