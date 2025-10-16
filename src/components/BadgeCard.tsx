/**
 * @fileoverview Badge Card Component for FunFeet Cycling App
 * 
 * Displays individual achievement badges with progress indicators
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../services/AchievementService';

interface BadgeCardProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ 
  badge, 
  size = 'medium', 
  showProgress = true 
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      containerWidth: 80,
      containerHeight: 100,
      iconSize: 24,
      nameSize: 10,
      progressSize: 8,
      progressBarHeight: 3,
    },
    medium: {
      containerWidth: 100,
      containerHeight: 120,
      iconSize: 30,
      nameSize: 12,
      progressSize: 10,
      progressBarHeight: 4,
    },
    large: {
      containerWidth: 120,
      containerHeight: 140,
      iconSize: 36,
      nameSize: 14,
      progressSize: 11,
      progressBarHeight: 5,
    },
  };

  const config = sizeConfig[size];
  const progressPercentage = Math.round(badge.progress * 100);

  return (
    <View style={[
      styles.container,
      {
        width: config.containerWidth,
        height: config.containerHeight,
        opacity: badge.isUnlocked ? 1 : 0.6,
      }
    ]}>
      {/* Badge Icon */}
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: badge.isUnlocked ? '#20A446' : '#E0E4E7',
        }
      ]}>
        <Text style={[
          styles.icon,
          { fontSize: config.iconSize }
        ]}>
          {badge.icon}
        </Text>
      </View>

      {/* Badge Name */}
      <Text 
        style={[
          styles.name,
          { 
            fontSize: config.nameSize,
            color: badge.isUnlocked ? '#1A1A1A' : '#666'
          }
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressBar,
            { height: config.progressBarHeight }
          ]}>
            <View style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                height: config.progressBarHeight,
                backgroundColor: badge.isUnlocked ? '#20A446' : '#4CAF50',
              }
            ]} />
          </View>
          
          <Text style={[
            styles.progressText,
            { 
              fontSize: config.progressSize,
              color: badge.isUnlocked ? '#20A446' : '#666'
            }
          ]}>
            {badge.isUnlocked ? '✓ Unlocked' : `${progressPercentage}%`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    textAlign: 'center',
  },
  name: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 14,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    backgroundColor: '#E0E4E7',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    borderRadius: 10,
  },
  progressText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default BadgeCard;
