# Technical Context - Click Target Game

## Technology Stack

### Core Framework

- **Phaser 3**: HTML5 game framework (version 3.88.2)
- **JavaScript (ES6+)**: Modern JavaScript features
- **HTML5**: Canvas/WebGL rendering
- **CSS3**: Styling and responsive design

### Development Environment

- **Local Development**: File-based development with local server
- **Code Editor**: VS Code with Phaser extensions
- **Version Control**: Git (assumed)
- **Browser Testing**: Chrome, Firefox, Safari, Mobile browsers

### Asset Technologies

- **Image Formats**: PNG sprites and backgrounds
- **Audio Formats**: WAV sound effects
- **Font Integration**: Google Fonts (Press Start 2P)
- **Asset Sources**: Kenney.nl asset packs

## Project Structure

```
Click Target Game/
├── index.html          # Main HTML entry point
├── phaser.js           # Phaser 3 library
├── project.config      # Project configuration
├── thumbnail.png       # Project thumbnail
├── assets/             # Game assets directory
│   ├── crosshair067.png # Target sprite
│   ├── bg_layer1.png   # Background image
│   └── click_004.wav   # Click sound effect
├── src/                # Source code directory
│   ├── main.js         # Game initialization
│   └── scenes/         # Game scenes
│       ├── Start.js    # Start scene (to be converted)
│       ├── Gameplay.js # New gameplay scene
│       └── GameOver.js # New game over scene
└── memory-bank/        # Documentation directory
```

## Development Setup

### Local Environment

1. **File Structure**: Project runs directly from file system
2. **Local Server**: Recommended for proper asset loading
3. **Browser Compatibility**: Modern browsers supporting ES6
4. **Mobile Testing**: Browser developer tools + actual devices

### Required Dependencies

- **Phaser 3 Library**: Included locally as phaser.js
- **Web Browser**: Modern browser with HTML5 support
- **Text Editor**: VS Code or similar
- **Local Server**: Python SimpleHTTPServer, Live Server extension, etc.

### Asset Integration

```javascript
// Asset loading pattern
preload() {
    // Images
    this.load.image('target', 'assets/crosshair067.png');
    this.load.image('background', 'assets/bg_layer1.png');

    // Audio
    this.load.audio('click', 'assets/click_004.wav');

    // Fonts (via CSS)
    // Press Start 2P loaded through Google Fonts
}
```

## Technical Constraints

### Browser Support

- **Minimum**: Chrome 60+, Firefox 55+, Safari 12+
- **Mobile**: iOS Safari 12+, Android Chrome 60+
- **Features**: ES6 support, Canvas/WebGL, Touch Events
- **Limitations**: No Internet Explorer support

### Performance Requirements

- **Frame Rate**: 60 FPS target
- **Load Time**: Sub-2-second initial load
- **Memory Usage**: Under 50MB peak usage
- **Battery**: Efficient mobile battery usage

### Responsive Design Implementation

- **Phaser Scale Mode**: RESIZE mode with dynamic dimensions
- **Viewport Management**: HTML meta viewport optimization
- **Orientation Handling**: Multiple detection methods for device rotation
- **Device Detection**: Screen size and touch capability based scaling
- **CSS Media Queries**: Responsive styling and layout control

### Mobile Optimization

- **Touch Events**: Optimized for mobile touch interaction
- **Target Sizing**: Device-specific scaling (Mobile: 1.2x, Tablet: 1.0x, Desktop: 0.8x)
- **Orientation Enforcement**: Landscape mode prompts for mobile/tablet devices
- **Performance**: Efficient rendering for mobile devices
- **Viewport Fixes**: iOS Safari specific viewport handling

## Coding Standards

### JavaScript Style

- **ES6 Classes**: Modern class syntax
- **Arrow Functions**: For event handlers and callbacks
- **Const/Let**: Modern variable declarations
- **Template Literals**: For string concatenation
- **Destructuring**: For object/array access

### Phaser Patterns

- **Scene Lifecycle**: Proper preload/create/update methods
- **Event System**: Use Phaser's built-in events
- **Asset Management**: Preload all assets properly
- **Memory Cleanup**: Remove event listeners on shutdown

### Code Organization

- **Modular Scenes**: Separate files for each game state
- **Component Classes**: Reusable game object classes
- **Configuration Objects**: Centralized game settings
- **Utility Functions**: Helper functions in separate modules

## Asset Specifications

### Image Assets

- **Target Sprite**: crosshair067.png (Kenney Crosshair Pack)
- **Background**: bg_layer1.png (Kenney Abstract Platformer Pack)
- **Format**: PNG with transparency
- **Resolution**: Optimized for 1280x720 base resolution

### Audio Assets

- **Click Sound**: click_004.wav (Kenney Interface Sounds)
- **Format**: WAV for compatibility
- **Duration**: Short sound effects (<1 second)
- **Volume**: Normalized levels

### Font Integration

- **Primary Font**: Press Start 2P (Google Fonts)
- **Usage**: Score display, UI elements
- **Fallback**: System monospace fonts
- **Loading**: CSS @import or link tag

## Development Workflow

### File Management

- **Source Control**: Git with .gitignore for build artifacts
- **Asset Organization**: Clear directory structure
- **Code Splitting**: Modular scene and component files
- **Documentation**: Inline comments and memory bank

### Testing Strategy

- **Local Testing**: Chrome DevTools for debugging
- **Mobile Testing**: Browser dev tools + actual devices
- **Performance Testing**: FPS monitoring, memory usage
- **Cross-browser**: Test on major browsers

### Debugging Tools

- **Browser DevTools**: Console, Network, Performance tabs
- **Phaser Debug**: Built-in debug features
- **Console Logging**: Structured logging approach
- **Visual Debugging**: On-screen debug information

## Technical Implementation Details

### Responsive System Architecture

```javascript
// Enhanced resize handling (src/main.js)
function handleResize() {
    setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        console.log(`Resizing game to: ${newWidth}x${newHeight}`);
        
        game.scale.resize(newWidth, newHeight);
        game.scale.refresh(); // Force refresh for mobile compatibility
    }, 150);
}

// Multiple orientation change detection methods
window.addEventListener('orientationchange', () => {
    // Progressive timeout attempts for different mobile browsers
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 300);
    setTimeout(handleResize, 500);
});

// Modern screen orientation API
if (screen && screen.orientation) {
    screen.orientation.addEventListener('change', handleResize);
}
```

### Device-Specific Scaling System

```javascript
// Dynamic target sizing (src/scenes/Gameplay.js)
getDeviceSpecificTargetScale() {
    const screenWidth = this.cameras.main.width;
    const isMobile = screenWidth <= 768 || 
        (this.input.activePointer && this.input.activePointer.wasTouch);
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    
    if (isMobile) return 1.2;      // Larger targets for touch interaction
    else if (isTablet) return 1.0; // Medium targets for tablets
    else return 0.8;               // Smaller targets for desktop precision
}

// Scene resize handler with target scale updates
handleResize(gameSize) {
    // Update all existing targets with new device-appropriate scales
    this.targets.forEach(target => {
        if (target && target.active) {
            const newScale = this.getDeviceSpecificTargetScale();
            target.setScale(newScale);
        }
    });
}
```

### CSS Responsive Controls

```css
/* Landscape enforcement for mobile and tablets (up to 1024px) */
@media screen and (max-width: 1024px) and (orientation: portrait) {
    body::before {
        content: "Please rotate your device to landscape mode for the best gaming experience";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
        transition: opacity 0.3s ease;
    }
    
    #game-container {
        filter: blur(3px);
        pointer-events: none;
        transition: filter 0.3s ease;
    }
}

/* Smooth transitions during orientation changes */
body, #game-container, canvas {
    transition: all 0.3s ease;
}

/* Fixed positioning to prevent content jumping */
@media screen and (max-width: 1024px) {
    #game-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    }
}
```

## Integration Points

### Future Expansion Capabilities

- **Local Storage**: High score saving
- **Web APIs**: Analytics, sharing
- **Third-party Services**: Ads, social features
- **Progressive Web App**: Offline capabilities

### API Considerations

- **Local Storage**: Browser storage API
- **Audio Context**: Web Audio API
- **Touch Events**: Pointer Events API
- **Performance**: Navigation Timing API

## Deployment Considerations

### File Distribution

- **Static Files**: HTML, JS, CSS, Images, Audio
- **No Backend**: Pure client-side application
- **CDN Ready**: Can be hosted on any static hosting
- **Compression**: Gzip/Brotli compression support

### Optimization Opportunities

- **Asset Compression**: Image and audio optimization
- **Code Minification**: JavaScript minification
- **Caching**: Browser caching strategies
- **Lazy Loading**: Deferred asset loading

### Browser Compatibility Testing

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Tablet**: iPad, Android tablets
- **Responsive**: Various screen sizes and orientations
