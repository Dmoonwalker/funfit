import React from "react"
import { View, Text, StyleSheet, useWindowDimensions } from "react-native"
import { BlurView } from "@react-native-community/blur"
import LinearGradient from "react-native-linear-gradient"

interface LandscapeMetricsOverlayProps {
  distance: number
  speed: number
  isConnected: boolean
  sessionGoalKm?: number
  dailyGoalKm?: number
}

const LandscapeMetricsOverlay: React.FC<LandscapeMetricsOverlayProps> = ({ distance, speed, isConnected, sessionGoalKm = 2, dailyGoalKm }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  
  // More aggressive scaling for smaller screens
  const isSmallScreen = screenWidth < 600 || screenHeight < 400
  const baseWidth = isSmallScreen ? screenWidth * 0.28 : screenWidth * 0.35
  const cardWidth = Math.min(baseWidth, isSmallScreen ? 180 : 240)
  
  const padding = Math.max(8, Math.round(cardWidth * 0.08))
  const radius = Math.max(10, Math.round(cardWidth * 0.08))
  const scale = cardWidth / 200
  const mainValueSize = Math.round((isSmallScreen ? 24 : 28) * scale)
  const unitSize = Math.round((isSmallScreen ? 11 : 13) * scale)
  const labelSize = Math.round((isSmallScreen ? 9 : 10) * scale)
  const distanceMeters = Math.max(0, Math.round(distance * 1000))

  // Dynamic positioning for smaller screens
  const topPosition = isSmallScreen ? 16 : 24
  const leftPosition = isSmallScreen ? 12 : 24

  return (
    <View style={[
      styles.container, 
      { 
        width: cardWidth, 
        padding, 
        borderRadius: radius,
        top: topPosition,
        left: leftPosition
      }
    ]}>
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={40}
        reducedTransparencyFallbackColor="rgba(180,180,180,0.4)"
      />

      {/* Frosted overlay tint */}
      <View style={styles.overlay} />

      {/* Optional subtle gradient to mimic real glass reflection */}
      <LinearGradient
        colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)"]}
        style={styles.gradient}
      />

      {/* Progress Bar for Daily Goal */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarBackground}>
            <View style={[
              styles.progressBarFill, 
              { width: `${Math.min((distance / (dailyGoalKm || 5)) * 100, 100)}%` }
            ]} />
          </View>
        </View>
        <Text style={[styles.progressText, { fontSize: labelSize }]}>
          {distance.toFixed(2)} / {dailyGoalKm || 5} km
        </Text>
      </View>

      {/* Distance Metric */}
      <View style={styles.metricSection}>
        <View style={styles.valueRow}>
          <Text style={[styles.mainValue, { fontSize: mainValueSize }]}>{isConnected ? distanceMeters.toLocaleString() : "0"}</Text>
          <Text style={[styles.unitText, { fontSize: unitSize }]}>m</Text>
        </View>
        <Text style={[styles.labelText, { fontSize: labelSize }]}>distance</Text>
      </View>

      {/* Speed Metric */}
      <View style={styles.metricSection}>
        <View style={styles.valueRow}>
          <Text style={[styles.mainValue, { fontSize: mainValueSize }]}>{isConnected ? speed.toFixed(1) : "0.0"}</Text>
          <Text style={[styles.unitText, { fontSize: unitSize }]}>Km/h</Text>
        </View>
        <Text style={[styles.labelText, { fontSize: labelSize }]}>Speed</Text>
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
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(200,200,200,0.15)", // soft frost tint
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  metricSection: {
    marginBottom: 14,
    alignItems: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  mainValue: {
    fontSize: 40,
    fontWeight: "500",
    color: "rgba(0,0,0,0.85)", // softened for glass look
    textAlign: "center",
  },
  unitText: {
    fontSize: 16,
    color: "rgba(0,0,0,0.85)", // lighter grey for harmony
    marginLeft: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  labelText: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.85)",
    textAlign: "center",
    marginTop: 1,
    fontWeight: "500",
  },
  progressSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  progressBarWrapper: {
    width: "100%",
    height: 6,
    marginBottom: 4,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: "rgba(200,200,200,0.4)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#20A446",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: "rgba(0,0,0,0.75)",
    textAlign: "center",
    fontWeight: "500",
  },
})

export default LandscapeMetricsOverlay
