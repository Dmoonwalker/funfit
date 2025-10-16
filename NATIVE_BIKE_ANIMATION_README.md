# Native Bike Animation Component

## Overview

This implementation creates a high-performance bike animation using native Android rendering with React Native bridge communication. The native component handles PNG sequence animation while React Native passes speed data and controls the animation state.

## Architecture

### Native Android Components

1. **BikeAnimationView.kt** - Main native view that renders PNG animation
2. **BikeAnimationViewManager.kt** - React Native bridge manager
3. **BikeAnimationPackage.kt** - Package registration

### React Native Components

1. **NativeBikeAnimation.tsx** - React Native wrapper component
2. **BikeAnimation.tsx** - Updated to use native component

## Features

### Native Android Features
- **High Performance**: Native rendering of PNG sequences
- **Speed-Responsive**: Frame rate adjusts based on cycling speed
- **Gender Support**: Male and female animation sequences
- **Memory Efficient**: Optimized bitmap loading and recycling
- **Smooth Animation**: 30-60 FPS based on speed

### React Native Bridge Features
- **Real-time Speed Updates**: Pass speed data from BLE
- **Connection State**: Control animation based on BLE connection
- **Gender Selection**: Switch between male/female animations
- **Event Handling**: Bluetooth press callbacks

## Setup Instructions

### 1. Asset Organization

Place your PNG animation frames in the Android assets folder:

```
android/app/src/main/assets/
├── images/
│   ├── CombinedMale/
│   │   ├── NewLevelSequence.0001000.png
│   │   ├── NewLevelSequence.0001001.png
│   │   └── ... (113 frames total)
│   └── CombinedFemale/
│       ├── NewLevelSequence.0001000.png
│       ├── NewLevelSequence.0001001.png
│       └── ... (113 frames total)
```

### 2. Build and Run

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..

# Run the app
npx react-native run-android
```

## Usage

### Basic Usage

```tsx
import NativeBikeAnimation from './components/NativeBikeAnimation';

<NativeBikeAnimation
  speed={25.5}
  isConnected={true}
  gender="male"
  onBluetoothPress={() => navigation.navigate('BLE')}
  style={{ width: '100%', height: 300 }}
/>
```

### With BLE Integration

```tsx
const { currentSpeed, isConnected } = useBLE();

<NativeBikeAnimation
  speed={currentSpeed}
  isConnected={isConnected}
  gender={selectedGender}
  onBluetoothPress={handleBluetoothPress}
  style={styles.animationContainer}
/>
```

## Performance Benefits

### Native Rendering
- **60 FPS**: Smooth animation at high speeds
- **Low CPU**: Native bitmap rendering
- **Memory Efficient**: Automatic bitmap recycling
- **Battery Optimized**: Hardware-accelerated rendering

### React Native Bridge
- **Minimal Overhead**: Only speed data passed
- **Real-time Updates**: Immediate speed changes
- **Event Handling**: Native touch events

## Configuration

### Animation Timing
- **Base Frame Rate**: 30 FPS at 0 km/h
- **Max Frame Rate**: 60 FPS at 30+ km/h
- **Speed Scaling**: Linear interpolation between rates

### Memory Management
- **Bitmap Loading**: Lazy loading from assets
- **Recycling**: Automatic cleanup on view destruction
- **Caching**: Frames cached in memory during animation

## Troubleshooting

### Common Issues

1. **Assets Not Found**
   - Ensure PNG files are in correct assets folder
   - Check file naming convention (7-digit format)
   - Verify asset folder structure

2. **Animation Not Starting**
   - Check `isConnected` prop is true
   - Verify speed value is being passed
   - Ensure native component is registered

3. **Performance Issues**
   - Reduce animation frame count if needed
   - Check bitmap sizes (should be optimized)
   - Monitor memory usage

### Debug Mode

Enable debug logging in native component:

```kotlin
// In BikeAnimationView.kt
private val DEBUG = BuildConfig.DEBUG

if (DEBUG) {
    Log.d("BikeAnimation", "Speed: $speed, Frame: $currentFrame")
}
```

## Future Enhancements

1. **iOS Support**: Create equivalent iOS native component
2. **Custom Animations**: Support for different animation sequences
3. **Performance Monitoring**: Real-time FPS tracking
4. **Advanced Effects**: Particle systems, lighting effects
5. **Gesture Support**: Touch interactions with animation

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | number | 0 | Current cycling speed in km/h |
| `isConnected` | boolean | false | BLE connection status |
| `gender` | string | "male" | Animation sequence ("male" or "female") |
| `onBluetoothPress` | function | undefined | Bluetooth icon press callback |
| `style` | ViewStyle | undefined | Component styling |

### Native Methods

| Method | Description |
|--------|-------------|
| `setSpeed(float)` | Update animation speed |
| `setGender(string)` | Switch animation sequence |
| `startAnimation()` | Begin animation loop |
| `stopAnimation()` | Stop animation loop |

## Conclusion

This native implementation provides optimal performance for bike animation rendering while maintaining seamless integration with React Native. The bridge communication ensures real-time updates while native rendering delivers smooth, high-performance animation.
