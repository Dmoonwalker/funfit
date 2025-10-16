import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface BikeAnimationScreenProps {
  navigation?: any;
}

const BikeAnimationScreen: React.FC<BikeAnimationScreenProps> = () => {
  const [currentEnvFrame, setCurrentEnvFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(10); // frames per second for combined animation
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const totalEnvFrames = 112; // combined_00000.png to combined_00111.png (112 frames)

  // Pre-define a subset of images to reduce memory usage (every 3rd frame)
  const combinedImages = [
    require('../../assets/images/combined_00000.png'),
    require('../../assets/images/combined_00003.png'),
    require('../../assets/images/combined_00006.png'),
    require('../../assets/images/combined_00009.png'),
    require('../../assets/images/combined_00012.png'),
    require('../../assets/images/combined_00015.png'),
    require('../../assets/images/combined_00018.png'),
    require('../../assets/images/combined_00021.png'),
    require('../../assets/images/combined_00024.png'),
    require('../../assets/images/combined_00027.png'),
    require('../../assets/images/combined_00030.png'),
    require('../../assets/images/combined_00033.png'),
    require('../../assets/images/combined_00036.png'),
    require('../../assets/images/combined_00039.png'),
    require('../../assets/images/combined_00042.png'),
    require('../../assets/images/combined_00045.png'),
    require('../../assets/images/combined_00048.png'),
    require('../../assets/images/combined_00051.png'),
    require('../../assets/images/combined_00054.png'),
    require('../../assets/images/combined_00057.png'),
    require('../../assets/images/combined_00060.png'),
    require('../../assets/images/combined_00063.png'),
    require('../../assets/images/combined_00066.png'),
    require('../../assets/images/combined_00069.png'),
    require('../../assets/images/combined_00072.png'),
    require('../../assets/images/combined_00075.png'),
    require('../../assets/images/combined_00078.png'),
    require('../../assets/images/combined_00081.png'),
    require('../../assets/images/combined_00084.png'),
    require('../../assets/images/combined_00087.png'),
    require('../../assets/images/combined_00090.png'),
    require('../../assets/images/combined_00093.png'),
    require('../../assets/images/combined_00096.png'),
    require('../../assets/images/combined_00099.png'),
    require('../../assets/images/combined_00102.png'),
    require('../../assets/images/combined_00105.png'),
    require('../../assets/images/combined_00108.png'),
    require('../../assets/images/combined_00111.png'),
  ];

  // Get image source from the subset array
  const getImageSource = (frameNumber: number) => {
    const subsetIndex = Math.floor(frameNumber / 3);
    return combinedImages[subsetIndex] || combinedImages[0];
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Reset animation
  const resetAnimation = () => {
    setCurrentEnvFrame(0);
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const animate = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    const frameDuration = 1000 / fps;

    if (deltaTime >= frameDuration) {
      setCurrentEnvFrame((prevFrame) => {
        const nextFrame = (prevFrame + 1) % totalEnvFrames;
        return nextFrame;
      });
      lastTimeRef.current = currentTime;
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [fps, totalEnvFrames]);

  // Animation loop - environment moving based on FPS
  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Environment Background */}
      <View style={styles.environmentContainer}>
        <Image
          source={getImageSource(currentEnvFrame)}
          style={styles.environmentImage}
          resizeMode="contain"
          onError={() => {
            Alert.alert(
              'Image Not Found',
              `combined_${currentEnvFrame.toString().padStart(5, '0')}.png not found. Please add the combined image series to assets/images/`
            );
          }}
          fadeDuration={0}
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Direct FPS Control */}
        <View style={styles.fpsContainer}>
          <Text style={styles.label}>FPS: {fps}</Text>
          <View style={styles.fpsButtons}>
            <TouchableOpacity
              style={[styles.fpsButton, styles.decreaseButton]}
              onPress={() => setFps(Math.max(1, fps - 1))}
            >
              <Text style={styles.fpsButtonText}>-</Text>
            </TouchableOpacity>
            
            <View style={styles.fpsDisplay}>
              <Text style={styles.fpsValue}>{fps}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.fpsButton, styles.increaseButton]}
              onPress={() => setFps(Math.min(120, fps + 1))}
            >
              <Text style={styles.fpsButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.playButton]}
            onPress={togglePlayPause}
          >
            <Text style={styles.buttonText}>
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetAnimation}
          >
            <Text style={styles.buttonText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Frame: {currentEnvFrame + 1} / {totalEnvFrames}
          </Text>
          <Text style={styles.statusText}>
            Status: {isPlaying ? 'Playing' : 'Stopped'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  environmentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  environmentImage: {
    width: width * 0.8, // 80% of screen width
    height: height * 0.4, // 40% of screen height
    resizeMode: 'contain', // Don't stretch, maintain aspect ratio
  },
  controlsContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  fpsContainer: {
    marginBottom: 20,
  },
  fpsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fpsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  decreaseButton: {
    backgroundColor: '#FF3B30',
  },
  increaseButton: {
    backgroundColor: '#4CAF50',
  },
  fpsDisplay: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  fpsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  fpsButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default BikeAnimationScreen; 