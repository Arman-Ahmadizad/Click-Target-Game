# System Patterns - Click Target Game

## System Architecture Overview

The Click Target Game follows a modular, scene-based architecture using Phaser 3's built-in scene management system. The architecture emphasizes separation of concerns, reusability, and maintainability.

## Core Architecture Patterns

### Scene-Based Structure

```
Game Structure:
├── Start Scene (Menu/Instructions)
├── Gameplay Scene (Main Game Logic)
└── GameOver Scene (Results/Restart)
```

**Pattern Benefits:**

- Clear separation of game states
- Easy state management and transitions
- Modular code organization
- Simplified debugging and testing

### Component-Based Design

**Target Component:**

- Encapsulates target behavior (spawn, destroy, click detection)
- Handles visual feedback and animations
- Manages lifecycle and cleanup
- Reusable across different game modes

### UI Components:

- **Hits Counter Component**: Displays successful target hits in top-right corner
- **Life Progress Bar Component**: Visual life management display
- **Sound Toggle Component**: Audio control button
- **Button Components**: For interactions and menu navigation

### Event-Driven Communication

- **Phaser Events**: Utilize Phaser's built-in event system
- **Custom Events**: Implement game-specific event patterns
- **State Changes**: Broadcast state changes to interested components
- **Input Handling**: Centralized input event processing

## Key Design Patterns

### Factory Pattern (Target Spawning)

```javascript
// Target factory for consistent creation
class TargetFactory {
  createTarget(scene, x, y) {
    return new Target(scene, x, y);
  }
}
```

### Observer Pattern (Hits/Life/Timers)

- **Hits System**: Observes target hits and updates counter
- **Life System**: Broadcasts life changes to UI components
- **Game State Observers**: For UI updates and state transitions

### State Pattern (Game States)

- Menu state → Playing state → Game Over state
- Each state handles its own input and logic
- Clear state transitions with validation

## Technical Implementation Patterns

### Input Handling System

```javascript
// Unified input handler
class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.setupInput();
  }

  setupInput() {
    // Handle both mouse and touch
    this.scene.input.on("pointerdown", this.handleInput, this);
  }

  handleInput(pointer) {
    // Unified input processing
  }
}
```

### Simplified Tracking System

```javascript
// Hit tracking without complex scoring
class HitTracker {
  constructor() {
    this.hits = 0;
  }

  recordHit() {
    this.hits++;
    this.updateDisplay();
  }

  getHitCount() {
    return this.hits;
  }
}
```

## Technical Implementation Patterns
### Progressive Difficulty System

```javascript
// Dynamic difficulty scaling based on hit milestones
class DifficultyManager {
  constructor() {
    this.baseSpawnRate = 2000;
    this.minSpawnRate = 200;
    this.baseTargetCount = 4;
    this.maxTargetCount = 12;
    this.baseTargetLifespan = 4000;
    this.minTargetLifespan = 1500;
  }

  calculateDifficulty(hits) {
    const difficultyFactor = Math.floor(hits / 10); // Every 10 hits
    return {
      spawnRate: Math.max(this.minSpawnRate, this.baseSpawnRate - (difficultyFactor * 150)),
      targetCount: Math.min(this.maxTargetCount, this.baseTargetCount + difficultyFactor),
      targetLifespan: Math.max(this.minTargetLifespan, this.baseTargetLifespan - (difficultyFactor * 200))
    };
  }
}
```

### Performance Monitoring System

```javascript
// FPS monitoring and mobile optimization
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
  }

  update() {
    const currentTime = performance.now();
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Auto-adjust quality based on performance
      if (this.fps < 45) {
        this.reduceQuality();
      }
    }
  }

  reduceQuality() {
    // Reduce target count, effects, or other performance-heavy features
  }
}
```

### Record Tracking System

```javascript
// Persistent high score and personal best tracking
class RecordManager {
  constructor() {
    this.personalBest = this.loadPersonalBest();
  }

  loadPersonalBest() {
    return parseInt(localStorage.getItem('clickTargetPersonalBest')) || 0;
  }

  checkNewRecord(hits) {
    if (hits > this.personalBest) {
      this.personalBest = hits;
      localStorage.setItem('clickTargetPersonalBest', hits.toString());
      return true; // New record!
    }
    return false;
  }

  getPersonalBest() {
    return this.personalBest;
  }
}
```

### Input Handling System

```javascript
// Unified input handler
class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.setupInput();
  }

  setupInput() {
    // Handle both mouse and touch
    this.scene.input.on("pointerdown", this.handleInput, this);
  }

  handleInput(pointer) {
    // Unified input processing
  }
}
```

### Asset Management Pattern

```javascript
// Preload all assets in scene preload
preload() {
    this.load.image('target', 'assets/crosshair067.png');
    this.load.image('background', 'assets/bg_layer1.png');
    this.load.audio('click', 'assets/click_004.wav');
}
```

### Game Loop Optimization

- **Update Method**: Efficient game loop processing
- **Delta Time**: Frame-rate independent calculations
- **Object Pooling**: Reuse target objects to reduce garbage collection
- **Batch Processing**: Group similar operations together

## Data Flow Patterns

### Initialization Flow

1. **Preload Phase**: Load all assets
2. **Create Phase**: Initialize game objects and systems
3. **Update Phase**: Continuous game loop processing
4. **Cleanup Phase**: Proper resource disposal

### Game Event Flow

1. **Input Event**: Player clicks/taps
2. **Detection**: Target click detection
3. **Processing**: Score update, sound playback
4. **Feedback**: Visual/audio feedback
5. **State Update**: Game state modifications

### Asset Loading Flow

1. **Preload**: Queue all required assets
2. **Loading**: Parallel asset loading
3. **Ready**: Assets available for use
4. **Error Handling**: Graceful failure management

## Performance Patterns

### Memory Management

- **Object Pooling**: Reuse target objects instead of creating/destroying
- **Event Cleanup**: Remove event listeners on scene shutdown
- **Texture Management**: Proper asset loading/unloading
- **Garbage Collection**: Minimize object creation in update loop

### Rendering Optimization

- **Sprite Batching**: Efficient rendering of similar objects
- **Camera Management**: Optimize view updates
- **Culling**: Hide off-screen objects
- **Layer Management**: Proper display list organization

## Error Handling Patterns

### Graceful Degradation

- **Asset Fallbacks**: Default sprites if assets fail to load
- **Audio Fallbacks**: Silent mode if audio fails
- **Input Fallbacks**: Mouse-only if touch fails
- **Feature Detection**: Check browser capabilities

### Debugging Support

- **Development Flags**: Toggle debug features
- **Console Logging**: Structured logging system
- **Visual Debugging**: On-screen debug information
- **Performance Monitoring**: FPS and memory tracking

## Future Expansion Patterns

### Plugin Architecture

- **Modular Features**: Easy addition of new features
- **Configuration System**: Flexible game settings
- **Extension Points**: Clear interfaces for enhancements
- **Version Management**: Backward compatibility support

### Scalability Patterns

- **Component System**: Easy addition of new target types
- **State Management**: Extensible game state system
- **Event System**: Flexible event broadcasting
- **Configuration**: Data-driven game parameters

## Integration Patterns

### Third-Party Services

- **Analytics**: Optional usage tracking
- **Storage**: Local storage for high scores
- **Social**: Sharing capabilities
- **Ads**: Optional ad integration points

### Cross-Platform Patterns

- **Responsive Design**: Flexible layout system
- **Input Abstraction**: Unified input handling
- **Performance Scaling**: Adaptive quality settings
- **Feature Detection**: Platform-specific optimizations
