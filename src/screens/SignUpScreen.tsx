import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { AuthService } from '../services/AuthService';

interface SignUpScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !username || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await AuthService.signUp({
        email,
        password,
        username,
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          'Account created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Sign Up Error', result.error || 'Sign up failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Welcome to funfit</Text>
                  <Text style={styles.subtitle}>Enter your details to continue!</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {/* Email Field */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../../assets/icons/email.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#999999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Username Field */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../../assets/icons/username.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#999999"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Phone Field */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../../assets/icons/phone.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone"
                        placeholderTextColor="#999999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../../assets/icons/password.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../../assets/icons/password.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Text style={styles.eyeIconText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.signUpButtonText}>Sign up</Text>
                    )}
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.loginLinkContainer}>
                    <Text style={styles.loginLinkText}>Already have an account? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Login')}
                      disabled={isLoading}
                    >
                      <Text style={styles.loginLink}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay for better contrast
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#666666',
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
  eyeIconText: {
    fontSize: 18,
  },
  signUpButton: {
    backgroundColor: '#20A446',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  signUpButtonDisabled: {
    backgroundColor: '#4A4A4A',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  loginLinkText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  loginLink: {
    color: '#20A446',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignUpScreen; 