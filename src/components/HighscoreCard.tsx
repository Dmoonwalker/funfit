import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native"
import { BlurView } from "@react-native-community/blur"
import { LeaderboardService } from "../services/LeaderboardService"
import { useAuth } from "../contexts/AuthContext"

interface HighscoreCardProps {
  // No props needed - component fetches user data internally
}

const HighscoreCard: React.FC<HighscoreCardProps> = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { currentUserId } = useAuth()
  
  // State for user stats
  const [userStats, setUserStats] = useState<{distance: number, calories: number, badges: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Determine orientation
  const isLandscape = screenWidth > screenHeight
  const isPortrait = !isLandscape
  
  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUserId) return
      
      setIsLoading(true)
      try {
        const stats = await LeaderboardService.getUserStats(currentUserId)
        setUserStats(stats)
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
        setUserStats({ distance: 0, calories: 0, badges: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserStats()
  }, [currentUserId])
  
  // Default values while loading or if no stats
  const distanceKm = userStats?.distance || 0
  const caloriesKcal = userStats?.calories || 0
  const badges = userStats?.badges || 0
  
  // Responsive sizing based on orientation
  const isSmallScreen = screenWidth < 600 || screenHeight < 400
  
  // Different sizing for portrait vs landscape
  let cardWidth, cardHeight, radius, padH, padV, titleSize, valueSize, subSize
  let bottomPosition, rightPosition, topPosition, leftPosition
  
  if (isPortrait) {
    // Portrait mode: smaller card, positioned at top
    cardWidth = Math.min(screenWidth * 0.85, 300)
    cardHeight = 120
    radius = 12
    padH = 16
    padV = 12
    titleSize = 14
    valueSize = 12
    subSize = 9
    topPosition = 60
    leftPosition = (screenWidth - cardWidth) / 2
    bottomPosition = undefined
    rightPosition = undefined
  } else {
    // Landscape mode: original positioning
    cardWidth = isSmallScreen ? Math.min(screenWidth * 0.35, 200) : Math.min(screenWidth * 0.40, 200)
    cardHeight = undefined
    radius = Math.max(12, Math.round(cardWidth * 0.08))
    padH = Math.max(10, Math.round(cardWidth * 0.06))
    padV = Math.max(10, Math.round(cardWidth * 0.06))
    titleSize = Math.round((isSmallScreen ? 12 : 14) * (cardWidth / 200))
    valueSize = Math.round((isSmallScreen ? 10 : 12) * (cardWidth / 200))
    subSize = Math.round((isSmallScreen ? 8 : 9) * (cardWidth / 200))
    bottomPosition = isSmallScreen ? 16 : 24
    rightPosition = isSmallScreen ? 12 : 24
    topPosition = undefined
    leftPosition = undefined
  }
  
  const distanceKmFormatted = Math.max(0, distanceKm).toFixed(1)

  // Show loading state
  if (isLoading) {
    return (
      <View style={[
        styles.container, 
        { 
          width: cardWidth,
          height: cardHeight,
          borderRadius: radius, 
          paddingHorizontal: padH, 
          paddingTop: padV, 
          paddingBottom: padV,
          bottom: bottomPosition,
          right: rightPosition,
          top: topPosition,
          left: leftPosition,
        }
      ]} pointerEvents="none">
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="light"
          blurAmount={32}
          reducedTransparencyFallbackColor="transparent"
        />
        <Text style={[styles.title, { fontSize: titleSize }]}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={[
      styles.container, 
      { 
        width: cardWidth,
        height: cardHeight,
        borderRadius: radius, 
        paddingHorizontal: padH, 
        paddingTop: padV, 
        paddingBottom: padV,
        bottom: bottomPosition,
        right: rightPosition,
        top: topPosition,
        left: leftPosition,
      }
    ]} pointerEvents="none">
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={32}
        reducedTransparencyFallbackColor="transparent"
      />

      <Text style={[styles.title, { fontSize: titleSize }]}>Highscore</Text>

      <View style={styles.row}>
        <View style={styles.col}>
          <Image source={require("../../assets/icons/distance.png")} style={[
            styles.icon,
            { width: isSmallScreen ? 16 : 20, height: isSmallScreen ? 16 : 20 }
          ]} />
          <Text style={[styles.valueText, { fontSize: valueSize }]} numberOfLines={1}>{distanceKmFormatted} km</Text>
          <Text style={[styles.subLabel, { fontSize: subSize }]}>best{"\n"}distance</Text>
        </View>
        <View style={styles.col}>
          <Image source={require("../../assets/icons/calories.png")} style={[
            styles.icon,
            { width: isSmallScreen ? 16 : 20, height: isSmallScreen ? 16 : 20 }
          ]} />
          <Text style={[styles.valueText, { fontSize: valueSize }]} numberOfLines={1}>{Math.max(0, caloriesKcal).toLocaleString()} Kcal</Text>
          <Text style={[styles.subLabel, { fontSize: subSize }]}>best{"\n"}calories</Text>
        </View>
        <View style={styles.col}>
          <Image source={require("../../assets/icons/badges.png")} style={[
            styles.icon,
            { width: isSmallScreen ? 16 : 20, height: isSmallScreen ? 16 : 20 }
          ]} />
          <Text style={[styles.valueText, { fontSize: valueSize }]} numberOfLines={1}>{Math.max(0, badges)}</Text>
          <Text style={[styles.subLabel, { fontSize: subSize }]}>Badges{"\n"}earned</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  // No overlay/gradient to keep pure transparent blur
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  col: {
    flex: 1,
    alignItems: "center",
    minWidth: 0, // Allow flex shrinking
  },
  icon: {
    tintColor: "#20A446",
    marginBottom: 6,
    resizeMode: "contain",
  },
  valueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
    flexWrap: "nowrap",
    numberOfLines: 1,
  },
  subLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
    opacity: 0.85,
  },
})

export default HighscoreCard


