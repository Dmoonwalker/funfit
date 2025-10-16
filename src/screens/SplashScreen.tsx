/**
 * @fileoverview Splash Screen for FunFeet Cycling App
 * 
 * Shows the FunFit logo centered on screen during app initialization.
 * Displays for a few seconds before navigating to the main app flow.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  useEffect(() => {
    // Show splash screen for 3 seconds, then navigate to main app
    const timer = setTimeout(() => {
      navigation.replace('MainApp');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: '100%',
    height: '60%',
    maxWidth: 400,
    maxHeight: 400,
  },
});

export default SplashScreen;
