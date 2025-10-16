/**
 * @fileoverview Profile Screen for FunFeet Cycling App
 * 
 * Displays user profile information, settings, and avatar selection.
 * Features a clean design matching the provided UI mockup.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useBLE } from '../contexts/BLEContext';
import { AuthService } from '../services/AuthService';

/**
 * ProfileScreen Component
 * 
 * Displays user profile with editable fields and avatar selection
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUserId, userProfile, refreshUserProfile, signOut } = useAuth();
  const { cleanupForLogout } = useBLE();
  
  const [avatarGender, setAvatarGender] = useState(userProfile?.avatar_gender || 'male');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || 'avatar.jpg');
  const [weight, setWeight] = useState(userProfile?.weight_kg?.toString() || '');
  const [dailyGoal, setDailyGoal] = useState(userProfile?.daily_goal_km?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(userProfile);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Track original values to detect changes
  const [originalAvatarGender, setOriginalAvatarGender] = useState(userProfile?.avatar_gender || 'male');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState(userProfile?.avatar_url || 'avatar.jpg');
  const [originalWeight, setOriginalWeight] = useState(userProfile?.weight_kg?.toString() || '');
  const [originalDailyGoal, setOriginalDailyGoal] = useState(userProfile?.daily_goal_km?.toString() || '');

  // Avatar options
  const avatarOptions = [
    { id: 'avatar-7.png', name: 'Avatar 7' },    
    { id: 'avatar-8.png', name: 'Avatar 8' },
    { id: 'avatar.jpg', name: 'Default' },
    { id: 'avatar-2.jpg', name: 'Avatar 2' },
    { id: 'avatar-3.jpg', name: 'Avatar 3' },
    { id: 'avatar-4.jpg', name: 'Avatar 4' },
    { id: 'avatar-5.jpg', name: 'Avatar 5' },
    { id: 'avatar-6.jpg', name: 'Avatar 6' },
  
  ];

  // Get avatar source based on avatar URL
  const getAvatarSource = (avatarFileName: string) => {
    switch (avatarFileName) {
      case 'avatar.jpg':
        return require('../../assets/avatar/avatar.jpg');
      case 'avatar-2.jpg':
        return require('../../assets/avatar/avatar-2.jpg');
      case 'avatar-3.jpg':
        return require('../../assets/avatar/avatar-3.jpg');
      case 'avatar-4.jpg':
        return require('../../assets/avatar/avatar-4.jpg');
      case 'avatar-5.jpg':
        return require('../../assets/avatar/avatar-5.jpg');
        case 'avatar-6.jpg':
          return require('../../assets/avatar/avatar-6.jpg');
      case 'avatar-7.png':
        return require('../../assets/avatar/avatar-7.png');
      case 'avatar-8.png':
        return require('../../assets/avatar/avatar-8.png');
      default:
        return require('../../assets/avatar/avatar.jpg');
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Check if any field has been modified
   */
  const hasChanges = () => {
    return (
      avatarGender !== originalAvatarGender ||
      avatarUrl !== originalAvatarUrl ||
      weight !== originalWeight ||
      dailyGoal !== originalDailyGoal
    );
  };

  /**
   * Fetch fresh profile data
   */
  const fetchProfileData = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const profile = await AuthService.getUserProfile(currentUserId);
      if (profile) {
        setProfileData(profile);
        setAvatarGender(profile.avatar_gender || 'male');
        setAvatarUrl(profile.avatar_url || 'avatar.jpg');
        setWeight(profile.weight_kg?.toString() || '');
        setDailyGoal(profile.daily_goal_km?.toString() || '');
        
        // Update original values
        setOriginalAvatarGender(profile.avatar_gender || 'male');
        setOriginalAvatarUrl(profile.avatar_url || 'avatar.jpg');
        setOriginalWeight(profile.weight_kg?.toString() || '');
        setOriginalDailyGoal(profile.daily_goal_km?.toString() || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, [currentUserId]);

  /**
   * Handle save all changes
   */
  const handleSaveAll = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'No user ID available');
      return;
    }

    // Validate inputs
    if (weight && isNaN(parseFloat(weight))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    if (dailyGoal && isNaN(parseFloat(dailyGoal))) {
      Alert.alert('Error', 'Please enter a valid daily goal');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('💾 [ProfileScreen] Saving all changes:', {
        avatarGender,
        weight,
        dailyGoal
      });
      
      // Build update object with only changed fields
      const updates: any = {};
      
      if (avatarGender !== originalAvatarGender) {
        updates.avatar_gender = avatarGender;
      }
      
      if (avatarUrl !== originalAvatarUrl) {
        updates.avatar_url = avatarUrl;
      }
      
      if (weight !== originalWeight && weight) {
        updates.weight_kg = parseFloat(weight);
      }
      
      if (dailyGoal !== originalDailyGoal && dailyGoal) {
        updates.daily_goal_km = parseFloat(dailyGoal); // Store km value directly
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('Info', 'No changes to save');
        return;
      }
      
      const success = await AuthService.updateUserProfile(currentUserId, updates);

      if (success) {
        Alert.alert('Success', 'Profile updated successfully');
        await fetchProfileData(); // Refresh local profile data
        await refreshUserProfile(); // Refresh AuthContext profile data
        console.log('💾 [ProfileScreen] All changes saved successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will disconnect your Bluetooth device and save your current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 ProfileScreen: Starting logout with BLE cleanup...');
              
              // First, cleanup BLE connections and save any active session
              await cleanupForLogout();
              console.log('✅ ProfileScreen: BLE cleanup completed');
              
              // Then sign out from authentication
              const result = await signOut();
              
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to logout');
              }
              // Navigation will be handled by AuthContext
            } catch (error) {
              console.error('❌ ProfileScreen: Logout error:', error);
              // Still try to sign out even if BLE cleanup fails
              try {
                await signOut();
              } catch (signOutError) {
                Alert.alert('Error', 'Failed to logout');
              }
            }
          },
        },
      ]
    );
  };

  /**
   * Load profile data on mount
   */
  useEffect(() => {
    fetchProfileData();
  }, [currentUserId, fetchProfileData]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.saveHeaderButton,
            hasChanges() && !isLoading ? styles.saveHeaderButtonEnabled : styles.saveHeaderButtonDisabled
          ]}
          onPress={handleSaveAll}
          disabled={!hasChanges() || isLoading}
        >
          <Text style={[
            styles.saveHeaderButtonText,
            hasChanges() && !isLoading ? styles.saveHeaderButtonTextEnabled : styles.saveHeaderButtonTextDisabled
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity 
            style={styles.profilePictureContainer}
            onPress={() => setShowAvatarModal(true)}
          >
            <Image 
              source={getAvatarSource(avatarUrl)} 
              style={styles.profilePicture}
            />
            <View style={styles.profilePictureOverlay}>
              <Text style={styles.profilePictureOverlayText}>Change</Text>
            </View>
          </TouchableOpacity>
            </View>

        {/* Avatar Selection Modal */}
        <Modal
          visible={showAvatarModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Avatar</Text>
                <TouchableOpacity 
                  onPress={() => setShowAvatarModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={avatarOptions}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.avatarModalOption,
                      avatarUrl === item.id && styles.avatarModalOptionSelected
                    ]}
                    onPress={() => {
                      setAvatarUrl(item.id);
                      setShowAvatarModal(false);
                    }}
                  >
                    <Image 
                      source={getAvatarSource(item.id)} 
                      style={styles.avatarModalImage}
                    />
                    <Text style={styles.avatarModalLabel}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.avatarModalGrid}
              />
            </View>
          </View>
        </Modal>

        {/* User Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User details</Text>
          <View style={styles.userDetailsGrid}>
            <View style={styles.userDetailItem}>
              <Text style={styles.userDetailLabel}>Email</Text>
              <Text style={styles.userDetailValue}>
                {profileData?.email || userProfile?.email || 'Not set'}
              </Text>
            </View>
            <View style={styles.userDetailItem}>
              <Text style={styles.userDetailLabel}>Username</Text>
              <Text style={styles.userDetailValue}>
                {profileData?.username || userProfile?.username || 'Not set'}
              </Text>
            </View>
            <View style={styles.userDetailItem}>
              <Text style={styles.userDetailLabel}>Phone number</Text>
              <Text style={styles.userDetailValue}>
                {'Not set'}
              </Text>
            </View>
            <View style={styles.userDetailItem}>
              <Text style={styles.userDetailLabel}>Calories</Text>
              <Text style={styles.userDetailValue}>
                {profileData?.daily_goal_calories || userProfile?.daily_goal_calories || '0'} Kcal
              </Text>
            </View>
          </View>
        </View>

        {/* Highscore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highscore</Text>
          <View style={styles.highscoreGrid}>
            <View style={styles.highscoreItem}>
              <Image source={require('../../assets/icons/distance.png')} style={styles.highscoreIcon} />
              <Text style={styles.highscoreValue}>2 KM</Text>
              <Text style={styles.highscoreLabel}>distance travel</Text>
            </View>
            <View style={styles.highscoreItem}>
              <Image source={require('../../assets/icons/calories.png')} style={styles.highscoreIcon} />
              <Text style={styles.highscoreValue}>5,000 Kcal</Text>
              <Text style={styles.highscoreLabel}>calories burnt</Text>
            </View>
            <View style={styles.highscoreItem}>
              <Image source={require('../../assets/icons/badges.png')} style={styles.highscoreIcon} />
              <Text style={styles.highscoreValue}>2</Text>
              <Text style={styles.highscoreLabel}>Badges earned</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal details</Text>
          
        
          {/* Weight Field */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Image source={require('../../assets/icons/username.png')} style={styles.inputIcon} />
              <Text style={styles.inputLabel}>weight</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter weight in kg"
              keyboardType="numeric"
              placeholderTextColor="#999999"
            />
          </View>

          <Text style={styles.disclaimerText}>
            the information collected above is used to calculate values of calories burnt, to fulfill a better experience
          </Text>
        </View>

        {/* Select Player Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Player</Text>
          <View style={styles.avatarSelector}>
            <TouchableOpacity 
              style={[styles.avatarOption, avatarGender === 'female' && styles.avatarOptionActive]}
              onPress={() => setAvatarGender('female')}
            >
              <Image source={require('../../assets/images/female.png')} style={styles.avatarImage} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.avatarOption, avatarGender === 'male' && styles.avatarOptionActive]}
              onPress={() => setAvatarGender('male')}
            >
              <Image source={require('../../assets/images/male.png')} style={styles.avatarImage} />
            </TouchableOpacity>
          </View>

        </View>

        {/* Daily Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily goals</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Image source={require('../../assets/icons/distance.png')} style={styles.inputIcon} />
              <Text style={styles.inputLabel}>travel distance</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              placeholder="Enter daily distance goal (km)"
              keyboardType="numeric"
              placeholderTextColor="#999999"
            />
          </View>

          <Text style={styles.disclaimerText}>
            the information collected above is used aid a better experience with this application and help you take accountability.
          </Text>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Text style={styles.logoutText}>log out of account</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>logout</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container
   */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Header section
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  /**
   * Back button
   */
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
  },

  /**
   * Back button text
   */
  backButtonText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },

  /**
   * Save header button
   */
  saveHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  /**
   * Save header button enabled
   */
  saveHeaderButtonEnabled: {
    backgroundColor: '#20A446',
  },

  /**
   * Save header button disabled
   */
  saveHeaderButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },

  /**
   * Save header button text
   */
  saveHeaderButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  /**
   * Save header button text enabled
   */
  saveHeaderButtonTextEnabled: {
    color: '#FFFFFF',
  },

  /**
   * Save header button text disabled
   */
  saveHeaderButtonTextDisabled: {
    color: '#999999',
  },

  /**
   * Scroll view
   */
  scrollView: {
    flex: 1,
  },

  /**
   * Scroll view content
   */
  scrollViewContent: {
    paddingBottom: 40,
  },

  /**
   * Section container
   */
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    padding: 20,
  },

  /**
   * Section title
   */
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 16,
  },

  /**
   * User details grid
   */
  userDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },

  /**
   * User detail item
   */
  userDetailItem: {
    width: '48%',
    alignItems: 'center',
  },

  /**
   * User detail label
   */
  userDetailLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },

  /**
   * User detail value
   */
  userDetailValue: {
    fontSize: 14,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    textAlign: 'center',
  },

  /**
   * Highscore grid
   */
  highscoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  /**
   * Highscore item
   */
  highscoreItem: {
    alignItems: 'center',
    flex: 1,
  },

  /**
   * Highscore icon
   */
  highscoreIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
    tintColor: '#20A446',
    resizeMode: 'contain',
  },

  /**
   * Highscore value
   */
  highscoreValue: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 4,
  },

  /**
   * Highscore label
   */
  highscoreLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },

  /**
   * Input group
   */
  inputGroup: {
    marginBottom: 20,
  },

  /**
   * Input label row
   */
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  /**
   * Input icon
   */
  inputIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#20A446',
  },

  /**
   * Input label
   */
  inputLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },

  /**
   * Gender selector
   */
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },

  /**
   * Gender button
   */
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  /**
   * Gender button active
   */
  genderButtonActive: {
    backgroundColor: '#20A446',
    borderColor: '#20A446',
  },

  /**
   * Gender button text
   */
  genderButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  /**
   * Gender button text active
   */
  genderButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /**
   * Text input
   */
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },

  /**
   * Save button
   */
  saveButton: {
    backgroundColor: '#20A446',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },

  /**
   * Save button disabled
   */
  saveButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },

  /**
   * Save button text
   */
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /**
   * Disclaimer text
   */
  disclaimerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },

  /**
   * Avatar selector
   */
  avatarSelector: {
    flexDirection: 'row',
    gap: 16,
  },

  /**
   * Avatar option
   */
  avatarOption: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },

  /**
   * Avatar option active
   */
  avatarOptionActive: {
    borderColor: '#20A446',
    borderWidth: 3,
  },

  /**
   * Avatar image
   */
  avatarImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
  },

  /**
   * Logout section
   */
  logoutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  /**
   * Logout text
   */
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '500',
  },

  /**
   * Logout button
   */
  logoutButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  /**
   * Logout button text
   */
  logoutButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /**
   * Profile picture section
   */
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },

  /**
   * Profile picture container
   */
  profilePictureContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#20A446',
  },

  /**
   * Profile picture image
   */
  profilePicture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /**
   * Profile picture overlay
   */
  profilePictureOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },

  /**
   * Profile picture overlay text
   */
  profilePictureOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /**
   * Modal overlay
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Modal content
   */
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },

  /**
   * Modal header
   */
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  /**
   * Modal title
   */
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },

  /**
   * Modal close button
   */
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Modal close button text
   */
  modalCloseButtonText: {
    fontSize: 20,
    color: '#666666',
    fontWeight: 'bold',
  },

  /**
   * Avatar modal grid
   */
  avatarModalGrid: {
    paddingHorizontal: 10,
  },

  /**
   * Avatar modal option
   */
  avatarModalOption: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    paddingBottom: 8,
  },

  /**
   * Avatar modal option selected
   */
  avatarModalOptionSelected: {
    borderColor: '#20A446',
    borderWidth: 3,
  },

  /**
   * Avatar modal image
   */
  avatarModalImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    marginBottom: 8,
  },

  /**
   * Avatar modal label
   */
  avatarModalLabel: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
  },
});

export default ProfileScreen;