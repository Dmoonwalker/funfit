/**
 * @fileoverview Liquid Glass Test Component
 * 
 * Simple test component to verify liquid glass effects work without external dependencies.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';

interface LiquidGlassTestProps {
  speed?: number;
}

const LiquidGlassTest: React.FC<LiquidGlassTestProps> = ({ speed = 25 }) => {
  const [testSpeed, setTestSpeed] = useState(speed);
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous shimmer animation
    const shimmerLoop = () => {
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnimation.setValue(0);
        shimmerLoop();
      });
    };

    shimmerLoop();

    // Speed-based scale animation
    const speedFactor = Math.min(testSpeed / 50, 1);
    Animated.spring(scaleAnimation, {
      toValue: 1 + (speedFactor * 0.1),
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [testSpeed, shimmerAnimation, scaleAnimation]);

  const increaseSpeed = () => setTestSpeed(prev => Math.min(prev + 5, 50));
  const decreaseSpeed = () => setTestSpeed(prev => Math.max(prev - 5, 0));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liquid Glass Test</Text>
      <Text style={styles.speedText}>Speed: {testSpeed} km/h</Text>
      
      {/* Test Liquid Glass Card */}
      <Animated.View 
        style={[
          styles.testCard,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <View style={styles.cardGradient} />
        
        <Animated.View 
          style={[
            styles.cardShimmer,
            {
              opacity: shimmerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
              transform: [
                {
                  translateX: shimmerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 100],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Text style={styles.cardText}>Liquid Glass Effect</Text>
        <Text style={styles.cardSubtext}>Pure React Native Implementation</Text>
      </Animated.View>

      {/* Speed Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={decreaseSpeed}>
          <Text style={styles.buttonText}>- Speed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={increaseSpeed}>
          <Text style={styles.buttonText}>+ Speed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  speedText: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  testCard: {
    width: 250,
    height: 150,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LiquidGlassTest;
