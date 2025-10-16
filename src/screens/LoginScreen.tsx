/**
 * @fileoverview Simple Login Screen for FunFeet Cycling App
 *
 * Provides basic email/password authentication and registration.
 *
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

const { height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { signIn, signUp, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('fadlu@gmail.com');
  const [password, setPassword] = useState('Dmoon@95');
  const [confirmPassword, _setConfirmPassword] = useState('');

  // UI state
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (isSignUp && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const result = await signUp({
          email: email.trim(),
          password,
        });

        if (result.success) {
          Alert.alert('Success', 'Account created successfully!');
          setIsSignUp(false);
        } else {
          Alert.alert('Error', result.error || 'Failed to create account');
        }
      } else {
        const result = await signIn({
          email: email.trim(),
          password,
        });

        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to sign in');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar with "log in" text */}
     
      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* White Login Card */}
        <View style={styles.loginCard}>
          {/* Title */}
          <Text style={styles.title}>Welcome to funfit</Text>
          <Text style={styles.subtitle}>Enter your email and password to continue!</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Image source={require('../../assets/icons/email.png')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Image source={require('../../assets/icons/password.png')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#999999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeIcon}>
              <Image source={require('../../assets/icons/dots.png')} style={styles.eyeIconImage} />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, (isSubmitting || isLoading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login now</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.signUpContainer}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Right Chat Icon */}
        <TouchableOpacity style={styles.chatIcon}>
          <Image source={require('../../assets/icons/achievement.png')} style={styles.chatIconImage} />
        </TouchableOpacity>
      </ImageBackground>
    </View>
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
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  topBarText: {
    fontSize: 16,
    color: '#8B4513', // Light brown color
    fontWeight: '400',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loginCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 50,
    minHeight: height * 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#999999',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  eyeIconImage: {
    width: 20,
    height: 20,
    tintColor: '#999999',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#999999',
  },
  loginButton: {
    backgroundColor: '#20A446',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#20A446',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#333333',
  },
  signUpLink: {
    color: '#20A446',
    fontWeight: 'bold',
  },
  chatIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: '#1E3A8A', // Dark blue
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
});

export default LoginScreen;