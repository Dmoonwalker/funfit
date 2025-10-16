/**
 * @fileoverview Onboarding Screen for FunFeet Cycling App
 *
 * Collects user preferences and saves to database.
 * Navigates to Home when onboarding is completed.
 *
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useAuth();

  // Get screen dimensions for responsive design
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 400 || height < 600;

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: 'male' as 'male' | 'female',
    avatarGender: 'male' as 'male' | 'female',
    weight: '',
    dailyGoal: '',
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideLeftAnim = useRef(new Animated.Value(-100)).current;  // Come from left
  const slideRightAnim = useRef(new Animated.Value(100)).current;  // Come from right
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation functions
  const animateStepTransition = useCallback(() => {
    // Reset animations - elements start from sides
    fadeAnim.setValue(0);
    slideLeftAnim.setValue(-150);   // Start further left
    slideRightAnim.setValue(150);   // Start further right
    scaleAnim.setValue(0.9);

    // Slower, more elegant entrance from sides
    Animated.parallel([
      // Fade in slowly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,  // Slower fade
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Slide from left (progress, header)
      Animated.timing(slideLeftAnim, {
        toValue: 0,
        duration: 1000,  // Slower slide
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Slide from right (content, buttons)
      Animated.timing(slideRightAnim, {
        toValue: 0,
        duration: 1100,  // Slightly staggered
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Gentle scale up
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideLeftAnim, slideRightAnim, scaleAnim]);

  const animateProgress = useCallback(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 4,
      duration: 800,  // Slower progress animation
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, currentStep]);

  // Initial animation on mount
  useEffect(() => {
    animateStepTransition();
    animateProgress();
  }, [animateStepTransition, animateProgress]);

  // Animate on step change
  useEffect(() => {
    animateStepTransition();
    animateProgress();
  }, [currentStep, animateStepTransition, animateProgress]);

  const handleNext = () => {
    console.log('ONBOARDING [SCREEN] ➡️ handleNext called for step:', currentStep);

    // Validation per step
    switch (currentStep) {
      case 1:
        // Gender selection - always valid since it has a default
        console.log('ONBOARDING [SCREEN] ✅ Step 1 validation passed');
        setCurrentStep(2);
        break;

      case 2:
        // Avatar selection - always valid since it has a default
        console.log('ONBOARDING [SCREEN] ✅ Step 2 validation passed');
        setCurrentStep(3);
        break;

      case 3:
        if (!formData.weight.trim() || Number(formData.weight) <= 0) {
          console.log('ONBOARDING [SCREEN] ❌ Step 3 validation failed: invalid weight');
          Alert.alert('Required', 'Please enter a valid weight');
          return;
        }
        console.log('ONBOARDING [SCREEN] ✅ Step 3 validation passed');
        setCurrentStep(4);
        break;

      case 4:
        if (!formData.dailyGoal.trim() || Number(formData.dailyGoal) <= 0) {
          console.log('ONBOARDING [SCREEN] ❌ Step 4 validation failed: invalid daily goal');
          Alert.alert('Required', 'Please enter a valid daily goal');
          return;
        }
        console.log('ONBOARDING [SCREEN] ✅ Step 4 validation passed, completing onboarding');
        handleComplete();
        break;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      console.log('ONBOARDING [SCREEN] ⬅️ Going back from step:', currentStep);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    console.log('ONBOARDING [SCREEN] 🏁 handleComplete called - final step');

    setLoading(true);
    console.log('ONBOARDING [SCREEN] 🔄 Loading state set to true');

    try {
      console.log('ONBOARDING [SCREEN] 🚀 Calling completeOnboarding...');
      const onboardingData = {
        weight_kg: Number(formData.weight),
        daily_goal_km: Number(formData.dailyGoal),
        gender: formData.gender,
        avatar_gender: formData.avatarGender,
        onboarding_completed: true,
      };
      console.log('ONBOARDING [SCREEN] 📝 Onboarding data to save:', onboardingData);

      const success = await completeOnboarding(onboardingData);
      console.log('ONBOARDING [SCREEN] 📋 completeOnboarding returned:', success);

      if (success) {
        console.log('ONBOARDING [SCREEN] ✅ Onboarding completed successfully, navigating to Home');
        navigation.navigate('Home' as never);
      } else {
        console.log('ONBOARDING [SCREEN] ❌ Onboarding failed - completeOnboarding returned false');
        Alert.alert('Error', 'Failed to save your preferences. Please try again.');
      }
    } catch (error) {
      console.error('ONBOARDING [SCREEN] 💥 Exception in handleComplete:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      console.log('ONBOARDING [SCREEN] 🔄 Setting loading to false');
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "What's your gender?";
      case 2: return "Choose your Player";
      case 3: return "What's your weight?";
      case 4: return "Daily cycling goal";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "This helps us personalize your experience";
      case 2: return "Select the character for your cycling animation";
      case 3: return "Enter your weight in kilograms";
      case 4: return "How many kilometers do you want to cycle daily?";
      default: return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={[
              styles.genderContainer,
              isLandscape && styles.landscapeGenderContainer
            ]}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.selected,
                  {
                    padding: isSmallScreen ? 20 : 30,
                    minWidth: isSmallScreen ? 100 : 140,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
              >
                <Text style={[
                  styles.genderEmoji,
                  formData.gender === 'male' && styles.selectedText,
                  { fontSize: isSmallScreen ? 40 : 50 }
                ]}>👨</Text>
                <Text style={[
                  styles.genderLabel,
                  formData.gender === 'male' && styles.selectedText,
                  { fontSize: isSmallScreen ? 16 : 18 }
                ]}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.selected,
                  {
                    padding: isSmallScreen ? 20 : 30,
                    minWidth: isSmallScreen ? 100 : 140,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
              >
                <Text style={[
                  styles.genderEmoji,
                  formData.gender === 'female' && styles.selectedText,
                  { fontSize: isSmallScreen ? 40 : 50 }
                ]}>👩</Text>
                <Text style={[
                  styles.genderLabel,
                  formData.gender === 'female' && styles.selectedText,
                  { fontSize: isSmallScreen ? 16 : 18 }
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={[
              styles.avatarContainer,
              isLandscape && styles.landscapeAvatarContainer
            ]}>
              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  formData.avatarGender === 'male' && styles.selected,
                  {
                    padding: isSmallScreen ? 15 : 20,
                    minWidth: isSmallScreen ? 120 : 160,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, avatarGender: 'male' }))}
              >
                <Image source={require('../../assets/images/male.png')} style={[
                  styles.avatarImage,
                  {
                    width: isSmallScreen ? 80 : 120,
                    height: isSmallScreen ? 80 : 120,
                  }
                ]} />
                <Text style={[
                  styles.avatarText,
                  formData.avatarGender === 'male' && styles.selectedText,
                  { fontSize: isSmallScreen ? 14 : 16 }
                ]}>Male Player</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  formData.avatarGender === 'female' && styles.selected,
                  {
                    padding: isSmallScreen ? 15 : 20,
                    minWidth: isSmallScreen ? 120 : 160,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, avatarGender: 'female' }))}
              >
                <Image source={require('../../assets/images/female.png')} style={[
                  styles.avatarImage,
                  {
                    width: isSmallScreen ? 80 : 120,
                    height: isSmallScreen ? 80 : 120,
                  }
                ]} />
                <Text style={[
                  styles.avatarText,
                  formData.avatarGender === 'female' && styles.selectedText,
                  { fontSize: isSmallScreen ? 14 : 16 }
                ]}>Female Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    width: isSmallScreen ? 100 : 120,
                    height: isSmallScreen ? 50 : 60,
                    fontSize: isSmallScreen ? 18 : 20,
                  }
                ]}
                value={formData.weight}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
                placeholder="70"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={[
                styles.unit,
                { fontSize: isSmallScreen ? 16 : 18 }
              ]}>kg</Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    width: isSmallScreen ? 100 : 120,
                    height: isSmallScreen ? 50 : 60,
                    fontSize: isSmallScreen ? 18 : 20,
                  }
                ]}
                value={formData.dailyGoal}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dailyGoal: text }))}
                placeholder="20"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={[
                styles.unit,
                { fontSize: isSmallScreen ? 16 : 18 }
              ]}>km</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        isLandscape && styles.landscapeContent
      ]}>
        {isLandscape ? (
          // Landscape layout - side by side
          <>
            {/* Left side - Progress and Header */}
            <View style={styles.landscapeLeft}>
              {/* Progress Indicator - slides from left */}
              <Animated.View style={[
                styles.progressContainer,
                { 
                  marginBottom: isSmallScreen ? 20 : 30,
                  opacity: fadeAnim,
                  transform: [{ translateX: slideLeftAnim }]
                }
              ]}>
                <View style={[
                  styles.progressBar,
                  { width: isSmallScreen ? 150 : 200 }
                ]}>
                  <Animated.View style={[
                    styles.progressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} />
                </View>
                <Animated.Text style={[
                  styles.stepIndicator,
                  { 
                    fontSize: isSmallScreen ? 12 : 14,
                    opacity: fadeAnim
                  }
                ]}>Step {currentStep} of 4</Animated.Text>
              </Animated.View>

              {/* Header - slides from left */}
              <Animated.View style={[
                styles.header,
                { 
                  marginBottom: isSmallScreen ? 20 : 30,
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideLeftAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}>
                <Animated.Text style={[
                  styles.title,
                  { 
                    fontSize: isSmallScreen ? 20 : 24,
                    opacity: fadeAnim
                  }
                ]}>{getStepTitle()}</Animated.Text>
                <Animated.Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 14 : 16,
                    opacity: fadeAnim
                  }
                ]}>{getStepSubtitle()}</Animated.Text>
              </Animated.View>
            </View>

            {/* Right side - Content and Buttons */}
            <View style={styles.landscapeRight}>
              {/* Step Content - slides from right */}
              <Animated.View style={[
                styles.stepContent,
                { 
                  flex: 0, 
                  marginBottom: isSmallScreen ? 20 : 30,
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideRightAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}>
                {renderStepContent()}
              </Animated.View>

              {/* Navigation Buttons */}
              <View style={[
                styles.buttonContainer,
                { marginTop: 0, marginBottom: 0 }
              ]}>
                {currentStep > 1 && (
                  <TouchableOpacity style={[
                    styles.button, 
                    styles.backButton,
                    { height: isSmallScreen ? 40 : 50 }
                  ]} onPress={handleBack}>
                    <Text style={[
                      styles.backButtonText,
                      { fontSize: isSmallScreen ? 14 : 16 }
                    ]}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.nextButton, 
                    loading && styles.buttonDisabled,
                    { height: isSmallScreen ? 40 : 50 }
                  ]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size={isSmallScreen ? "small" : "large"} />
                  ) : (
                    <Text style={[
                      styles.nextButtonText,
                      { fontSize: isSmallScreen ? 14 : 16 }
                    ]}>
                      {currentStep === 4 ? 'Complete Setup' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // Portrait layout - original vertical layout
          <>
            {/* Progress Indicator - slides from left */}
            <Animated.View style={[
              styles.progressContainer,
              { 
                marginBottom: isSmallScreen ? 20 : 30,
                opacity: fadeAnim,
                transform: [{ translateX: slideLeftAnim }]
              }
            ]}>
              <View style={[
                styles.progressBar,
                { width: isSmallScreen ? 150 : 200 }
              ]}>
                <Animated.View style={[
                  styles.progressFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} />
              </View>
              <Animated.Text style={[
                styles.stepIndicator,
                { 
                  fontSize: isSmallScreen ? 12 : 14,
                  opacity: fadeAnim
                }
              ]}>Step {currentStep} of 4</Animated.Text>
            </Animated.View>

            {/* Header - slides from left */}
            <Animated.View style={[
              styles.header,
              { 
                marginBottom: isSmallScreen ? 30 : 40,
                opacity: fadeAnim,
                transform: [
                  { translateX: slideLeftAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}>
              <Animated.Text style={[
                styles.title,
                { 
                  fontSize: isSmallScreen ? 20 : 24,
                  opacity: fadeAnim
                }
              ]}>{getStepTitle()}</Animated.Text>
              <Animated.Text style={[
                styles.subtitle,
                { 
                  fontSize: isSmallScreen ? 14 : 16,
                  opacity: fadeAnim
                }
              ]}>{getStepSubtitle()}</Animated.Text>
            </Animated.View>

            {/* Step Content - slides from right */}
            <Animated.View style={[
              styles.stepContent,
              {
                opacity: fadeAnim,
                transform: [
                  { translateX: slideRightAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}>
              {renderStepContent()}
            </Animated.View>

            {/* Navigation Buttons */}
            <View style={[
              styles.buttonContainer,
              { marginBottom: isSmallScreen ? 10 : 20 }
            ]}>
              {currentStep > 1 && (
                <TouchableOpacity style={[
                  styles.button, 
                  styles.backButton,
                  { height: isSmallScreen ? 40 : 50 }
                ]} onPress={handleBack}>
                  <Text style={[
                    styles.backButtonText,
                    { fontSize: isSmallScreen ? 14 : 16 }
                  ]}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.nextButton, 
                  loading && styles.buttonDisabled,
                  { height: isSmallScreen ? 40 : 50 }
                ]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size={isSmallScreen ? "small" : "large"} />
                ) : (
                  <Text style={[
                    styles.nextButtonText,
                    { fontSize: isSmallScreen ? 14 : 16 }
                  ]}>
                    {currentStep === 4 ? 'Complete Setup' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#20A446',
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  genderButton: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  avatarButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    backgroundColor: '#E8F5E8',
    borderWidth: 3,
    borderColor: '#20A446',
  },
  selectedText: {
    color: '#20A446',
    fontWeight: '600',
  },
  genderEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  genderLabel: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '500',
  },
  avatarImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 120,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
    fontWeight: '600',
  },
  unit: {
    fontSize: 18,
    color: '#666666',
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  backButton: {
    backgroundColor: '#F5F5F5',
  },
  nextButton: {
    backgroundColor: '#20A446',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  backButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /**
   * Landscape layout styles
   */
  landscapeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },

  landscapeRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },

  /**
   * Landscape gender container - vertical layout for better fit
   */
  landscapeGenderContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },

  /**
   * Landscape avatar container - vertical layout for better fit
   */
  landscapeAvatarContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
});

export default OnboardingScreen;
