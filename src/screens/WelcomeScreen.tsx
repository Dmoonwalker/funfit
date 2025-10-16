/**
 * @fileoverview Welcome Screen for FunFeet Cycling App
 * 
 * Shows a beautiful cycling background with login and signup options.
 * Uses background.png as the background image with an overlay for the form.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Dimensions,
} from 'react-native';

interface WelcomeScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Welcome to FunFit</Text>
              <Text style={styles.subtitle}>
                Enter your email and password to continue!
              </Text>
            </View>
            
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>Login now</Text>
              </TouchableOpacity>
              
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>OR</Text>
                <View style={styles.separatorLine} />
              </View>
              
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
              >
                <Text style={styles.buttonText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker overlay for better text readability
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 50,
    minHeight: height * 0.45, // Slightly taller for better spacing
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonSection: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#20A446',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  signUpButton: {
    backgroundColor: '#20A446',
    borderRadius: 12,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
});

export default WelcomeScreen;
