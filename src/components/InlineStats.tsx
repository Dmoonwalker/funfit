import React, { useMemo } from "react"
import { View, Text, StyleSheet, useWindowDimensions } from "react-native"

interface InlineStatsProps {
  elapsedMs: number
  cycles: number
  caloriesKcal?: number
}

const InlineStats: React.FC<InlineStatsProps> = ({ elapsedMs, cycles, caloriesKcal = 0 }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  
  // Make it bigger - increase font sizes
  const isSmallScreen = screenWidth < 600 || screenHeight < 400
  const base = isSmallScreen ? Math.max(200, Math.min(400, screenWidth)) : Math.max(250, Math.min(500, screenWidth))
  const valueSize = Math.round((isSmallScreen ? 15 : 18) * (base / 360))
  const labelSize = Math.round((isSmallScreen ? 11 : 12) * (base / 360))
  const unitSize = Math.round((isSmallScreen ? 8 : 7) * (base / 360))

  const timeString = useMemo(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }, [elapsedMs])

  const blockMargin = isSmallScreen ? 16 : 24 // Increased margin for bigger layout

  return (
    <View style={styles.row} pointerEvents="none">
      <View style={styles.blockFirst}>
        <Text style={[styles.label, { fontSize: labelSize }]}>Time</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { fontSize: valueSize }]}>{timeString}</Text>
        </View>
      </View>
      <View style={[styles.block, { marginLeft: blockMargin }]}>
        <Text style={[styles.label, { fontSize: labelSize }]}>Calories</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { fontSize: valueSize }]}>{Math.max(0, caloriesKcal).toLocaleString()}</Text>
          <Text style={[styles.unit, { fontSize: unitSize }]}>Kcal</Text>
        </View>
      </View>
      <View style={[styles.block, { marginLeft: blockMargin }]}>
        <Text style={[styles.label, { fontSize: labelSize }]}>Cycles</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { fontSize: valueSize }]}>{Math.max(0, cycles).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  block: {
    alignItems: 'center',
  },
  blockFirst: {
    marginLeft: 0,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 0,
    fontWeight: '600',
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingLeft: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  unit: {
    fontSize: 10,
    color: '#000000',
    marginLeft: 6,
    fontWeight: '600',
  },
})

export default InlineStats


