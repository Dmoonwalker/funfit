import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Avatar from '../components/Avatar';

const AvatarScreen: React.FC = () => {
  const [speed, setSpeed] = useState(0);

  const increaseSpeed = () => {
    setSpeed(prev => Math.min(prev + 5, 50));
  };

  const decreaseSpeed = () => {
    setSpeed(prev => Math.max(prev - 5, 0));
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/Background000.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bike Wheel Animation</Text>
          <Text style={styles.subtitle}>Speed: {speed.toFixed(1)} km/h</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Avatar speed={speed} size={250} />
        </View>

        <View style={styles.controls}>
          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Speed Control</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50}
              value={speed}
              onValueChange={setSpeed}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#DEDEDE"
            />
            <Text style={styles.speedText}>
              {speed.toFixed(1)} km/h
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={decreaseSpeed}>
              <Text style={styles.buttonText}>-5 km/h</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={increaseSpeed}>
              <Text style={styles.buttonText}>+5 km/h</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetContainer}>
            <Text style={styles.label}>Quick Speeds</Text>
            <View style={styles.presetButtons}>
              {[0, 10, 20, 30, 40, 50].map((presetSpeed) => (
                <TouchableOpacity
                  key={presetSpeed}
                  style={[
                    styles.presetButton,
                    speed === presetSpeed && styles.presetButtonActive
                  ]}
                  onPress={() => setSpeed(presetSpeed)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    speed === presetSpeed && styles.presetButtonTextActive
                  ]}>
                    {presetSpeed}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>• Drag the slider to change speed</Text>
          <Text style={styles.infoText}>• Use +/- buttons for quick adjustments</Text>
          <Text style={styles.infoText}>• Tap preset buttons for specific speeds</Text>
          <Text style={styles.infoText}>• Wheel animation FPS changes with speed</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    padding: 20 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  avatarContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  controls: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
  },
  sliderContainer: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 10 
  },
  slider: { 
    width: '100%', 
    height: 40 
  },
  speedText: { 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#007AFF', 
    marginTop: 10 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presetContainer: { 
    marginBottom: 10 
  },
  presetButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  presetButton: { 
    backgroundColor: '#f0f0f0', 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    borderRadius: 20, 
    marginBottom: 8, 
    minWidth: 60, 
    alignItems: 'center' 
  },
  presetButtonActive: { 
    backgroundColor: '#007AFF' 
  },
  presetButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666' 
  },
  presetButtonTextActive: { 
    color: '#fff' 
  },
  info: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 12, 
    padding: 15,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
  },
  infoText: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 5 
  },
});

export default AvatarScreen;
