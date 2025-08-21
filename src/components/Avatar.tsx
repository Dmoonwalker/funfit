import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
} from 'react-native';

interface AvatarProps {
  speed: number;
  size?: number;
}

const TOTAL_WHEEL_FRAMES = 15;

// Static array for wheel images
const wheelFrames = [
  require('../../assets/images/0000.png'),
  require('../../assets/images/0001.png'),
  require('../../assets/images/0002.png'),
  require('../../assets/images/0003.png'),
  require('../../assets/images/0004.png'),
  require('../../assets/images/0005.png'),
  require('../../assets/images/0006.png'),
  require('../../assets/images/0007.png'),
  require('../../assets/images/0008.png'),
  require('../../assets/images/0009.png'),
  require('../../assets/images/0010.png'),
  require('../../assets/images/0011.png'),
  require('../../assets/images/0012.png'),
  require('../../assets/images/0013.png'),
  require('../../assets/images/0014.png'),
];

const Avatar: React.FC<AvatarProps> = ({ speed, size = 200 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Calculate FPS from speed
  const calculateFPS = (s: number) => {
    const base = 12;
    const multiplier = 1.5;
    return base + s * multiplier;
  };

  // Wheel animation based on speed
  useEffect(() => {
    if (speed <= 0) {
      setCurrentFrame(0);
      return;
    }

    const fps = calculateFPS(speed);
    const frameInterval = 1000 / fps;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % TOTAL_WHEEL_FRAMES);
    }, frameInterval);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.wheelContainer, { width: size, height: size }]}>
        <Image
          source={wheelFrames[currentFrame]}
          style={[styles.wheelImage, { width: size, height: size }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.speedIndicator}>
        <Text style={styles.speedValue}>{Math.round(speed)}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Wheel Frame: {currentFrame + 1}/{TOTAL_WHEEL_FRAMES}</Text>
        <Text style={styles.debugText}>FPS: {calculateFPS(speed).toFixed(1)}</Text>
        <Text style={styles.debugText}>Speed: {speed.toFixed(1)} km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheelContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelImage: {},
  speedIndicator: {
    position: 'absolute',
    top: -20,
    right: -20,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    minWidth: 60,
    alignItems: 'center',
    zIndex: 10,
  },
  speedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  speedUnit: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
  debugInfo: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
});

export default Avatar;
