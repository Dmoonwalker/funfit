package com.funfeetble

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import android.os.Handler
import android.os.Looper
import kotlin.math.min
import kotlin.math.max

/**
 * Native Android Bike Animation View
 * Renders cycling animation using PNG sequence based on speed data from React Native
 */
class BikeAnimationView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    // Animation properties
    private var currentFrame = 0
    private var speed = 0f
    private var isAnimating = false
    private var gender = "male" // "male" or "female"
    private var resizeMode = "stretch" // "stretch", "contain", "cover"
    private var isConnected = false
    private var rpm = 0f
    private var distance = 0f
    private var calories = 0f
    
    // Animation timing
    private val handler = Handler(Looper.getMainLooper())
    private var animationRunnable: Runnable? = null
    
    // Bitmap arrays for animation frames
    private val maleFrames = mutableListOf<Bitmap>()
    private val femaleFrames = mutableListOf<Bitmap>()
    private var currentFrames = maleFrames
    
    // Paint for rendering
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    
    // Animation timing calculation
    private var lastFrameTime = 0L
    private val baseFrameRate = 5f   // Minimum FPS at low speed (0 km/h)
    private val maxFrameRate = 120f  // Maximum FPS at high speed (30 km/h)
    private val maxSpeed = 30f       // Maximum speed for FPS scaling (30 km/h)
    
    init {
        loadAnimationFrames()
        android.util.Log.d("BikeAnimation", "🏗️ BikeAnimationView initialized with gender: $gender")
        // Don't auto-start animation - wait for setSpeed() call
    }
    
    /**
     * Load PNG animation frames from assets
     */
    private fun loadAnimationFrames() {
        try {
            // Load male frames (assuming 113 frames)
            for (i in 0..112) {
                val frameNumber = String.format("%07d", 1000 + i)
                val assetPath = "images/CombinedMale/NewLevelSequence.$frameNumber.png"
                val inputStream = context.assets.open(assetPath)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                maleFrames.add(bitmap)
                inputStream.close()
            }
            
            // Load female frames (assuming similar structure)
            for (i in 0..112) {
                val frameNumber = String.format("%07d", 1000 + i)
                val assetPath = "images/CombinedFemale/NewLevelSequence.$frameNumber.png"
                val inputStream = context.assets.open(assetPath)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                femaleFrames.add(bitmap)
                inputStream.close()
             }
             
             // Set initial frames based on current gender
             currentFrames = if (gender == "female") femaleFrames else maleFrames
             android.util.Log.d("BikeAnimation", "🎭 loadAnimationFrames: Initial gender='$gender', maleFrames=${maleFrames.size}, femaleFrames=${femaleFrames.size}")
         } catch (e: Exception) {
             e.printStackTrace()
             android.util.Log.e("BikeAnimation", "❌ Failed to load animation frames", e)
         }
    }

    /**
     * Ensure frames for the requested gender are loaded (lazy-load fallback)
     */
    private fun ensureFramesLoadedForGender(requestedGender: String) {
        try {
            if (requestedGender == "female" && femaleFrames.isEmpty()) {
                for (i in 0..112) {
                    val frameNumber = String.format("%07d", 1000 + i)
                    val assetPath = "images/CombinedFemale/NewLevelSequence.$frameNumber.png"
                    val inputStream = context.assets.open(assetPath)
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    femaleFrames.add(bitmap)
                    inputStream.close()
                }
            } else if (requestedGender == "male" && maleFrames.isEmpty()) {
                for (i in 0..112) {
                    val frameNumber = String.format("%07d", 1000 + i)
                    val assetPath = "images/CombinedMale/NewLevelSequence.$frameNumber.png"
                    val inputStream = context.assets.open(assetPath)
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    maleFrames.add(bitmap)
                    inputStream.close()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    /**
     * Set speed from React Native bridge
     */
    fun setSpeed(newSpeed: Float) {
        val oldSpeed = speed
        speed = max(0f, min(newSpeed, maxSpeed))
        
        android.util.Log.d("BikeAnimation", "🏗️ setSpeed called: newSpeed=$newSpeed, clampedSpeed=$speed, wasAnimating=$isAnimating")
        
        updateFrameRate()
        
        // Start animation only if connected and speed > 0; stop if speed == 0 or disconnected
        if (isConnected && speed > 0 && !isAnimating) {
            android.util.Log.d("BikeAnimation", "🚀 Starting native animation - speed=$speed")
            startAnimation()
        } else if ((speed == 0f || !isConnected) && isAnimating) {
            android.util.Log.d("BikeAnimation", "🛑 Stopping native animation - speed=0")
            stopAnimation()
        } else {
            android.util.Log.d("BikeAnimation", "⏸️ No animation change - speed=$speed, isAnimating=$isAnimating")
        }
    }
    
    /**
     * Set gender from React Native bridge
     */
    fun setGender(newGender: String) {
        val normalized = newGender.lowercase()
        val oldGender = gender
        gender = if (normalized == "female") "female" else "male"
        
        android.util.Log.d("BikeAnimation", "🧑‍🦱 setGender called: '$newGender' -> normalized: '$normalized' -> gender: '$gender' (was: '$oldGender')")
        
        ensureFramesLoadedForGender(gender)
        val oldFrames = currentFrames
        currentFrames = if (gender == "female") femaleFrames else maleFrames
        
        android.util.Log.d("BikeAnimation", "👟 setGender: switched from ${oldFrames.size} frames to ${currentFrames.size} frames")
        android.util.Log.d("BikeAnimation", "🎭 Frame sets: maleFrames=${maleFrames.size}, femaleFrames=${femaleFrames.size}")
        
        currentFrame = 0 // Reset to first frame
        invalidate() // Force redraw immediately
    }
    
    /**
     * Set resize mode from React Native bridge
     */
    fun setResizeMode(newResizeMode: String) {
        resizeMode = newResizeMode
        invalidate() // Redraw with new resize mode
    }

    /**
     * Set connection status from React Native bridge
     */
    fun setIsConnected(newIsConnected: Boolean) {
        isConnected = newIsConnected
        android.util.Log.d("BikeAnimation", "🔗 setIsConnected: $isConnected (speed=$speed, isAnimating=$isAnimating)")
        if (!isConnected) {
            // Stop immediately when disconnected
            if (isAnimating) stopAnimation()
            return
        }
        // If connected and speed > 0, ensure animation is running
        if (isConnected && speed > 0 && !isAnimating) {
            startAnimation()
        }
    }

    /**
     * Set RPM from React Native bridge
     */
    fun setRpm(newRpm: Float) {
        rpm = max(0f, newRpm)
        // Could influence animation dynamics in the future
    }

    /**
     * Set distance from React Native bridge
     */
    fun setDistance(newDistance: Float) {
        distance = max(0f, newDistance)
    }

    /**
     * Set calories from React Native bridge
     */
    fun setCalories(newCalories: Float) {
        calories = max(0f, newCalories)
    }
    
    /**
     * Start animation
     */
    fun startAnimation() {
        if (!isAnimating) {
            isAnimating = true
            lastFrameTime = System.currentTimeMillis()
            scheduleNextFrame()
        }
    }
    
    /**
     * Stop animation
     */
    fun stopAnimation() {
        isAnimating = false
        animationRunnable?.let { handler.removeCallbacks(it) }
    }
    
    /**
     * Calculate frame rate based on speed
     */
    private fun updateFrameRate() {
        // Higher speed = higher frame rate for smoother animation
        val speedFactor = speed / maxSpeed
        val targetFrameRate = baseFrameRate + (maxFrameRate - baseFrameRate) * speedFactor
        // Frame rate affects animation smoothness
    }
    
    /**
     * Schedule next animation frame
     */
    private fun scheduleNextFrame() {
        if (!isAnimating) return
        
        // DON'T schedule frames when speed is 0 or disconnected
        if (speed <= 0f || !isConnected) {
            android.util.Log.d("BikeAnimation", "🛑 Not scheduling frame - speed is 0")
            return
        }
        
        animationRunnable = Runnable {
            updateAnimation()
            invalidate() // Trigger redraw
            scheduleNextFrame()
        }
        
        // Calculate frame interval based on speed (0-30 km/h scale)
        // Speed 0 km/h = 5 FPS (slow), Speed 30 km/h = 120 FPS (very fast)
        val speedFactor = min(speed / maxSpeed, 1f) // Cap at 1.0 for speeds > 30 km/h
        val currentFPS = baseFrameRate + (maxFrameRate - baseFrameRate) * speedFactor
        val frameInterval = (1000f / currentFPS).toLong()
        
        android.util.Log.d("BikeAnimation", "🎬 Speed: ${speed} km/h, FPS: $currentFPS, Interval: ${frameInterval}ms")
        
        handler.postDelayed(animationRunnable!!, frameInterval)
    }
    
    /**
     * Update animation frame
     */
    private fun updateAnimation() {
        if (currentFrames.isNotEmpty()) {
            currentFrame = (currentFrame + 1) % currentFrames.size
        }
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        if (currentFrames.isNotEmpty() && currentFrame < currentFrames.size) {
            val bitmap = currentFrames[currentFrame]
            if (bitmap != null && !bitmap.isRecycled) {
                when (resizeMode) {
                    "contain" -> {
                        val viewW = width.toFloat()
                        val viewH = height.toFloat()
                        val bmpW = bitmap.width.toFloat()
                        val bmpH = bitmap.height.toFloat()
                        val scale = kotlin.math.min(viewW / bmpW, viewH / bmpH)
                        val drawW = (bmpW * scale).toInt()
                        val drawH = (bmpH * scale).toInt()
                        val left = (viewW - drawW) / 2f
                        val top = (viewH - drawH) / 2f
                        val dst = android.graphics.Rect(left.toInt(), top.toInt(), (left + drawW).toInt(), (top + drawH).toInt())
                        canvas.drawBitmap(bitmap, null, dst, paint)
                    }
                    "cover" -> {
                        val viewW = width.toFloat()
                        val viewH = height.toFloat()
                        val bmpW = bitmap.width.toFloat()
                        val bmpH = bitmap.height.toFloat()
                        val scale = kotlin.math.max(viewW / bmpW, viewH / bmpH)
                        val drawW = (bmpW * scale).toInt()
                        val drawH = (bmpH * scale).toInt()
                        val left = (viewW - drawW) / 2f
                        val top = (viewH - drawH) / 2f
                        val dst = android.graphics.Rect(left.toInt(), top.toInt(), (left + drawW).toInt(), (top + drawH).toInt())
                        canvas.drawBitmap(bitmap, null, dst, paint)
                    }
                    else -> {
                        // stretch
                        canvas.drawBitmap(bitmap, null, android.graphics.Rect(0, 0, width, height), paint)
                    }
                }
            }
        }
    }
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        android.util.Log.d("BikeAnimation", "🔌 onAttachedToWindow - speed=$speed, isAnimating=$isAnimating")
        
        if (maleFrames.isEmpty() || femaleFrames.isEmpty()) {
            loadAnimationFrames()
        }
        
        // Auto-start animation if connected and speed > 0 when view attaches
        if (isConnected && speed > 0f && !isAnimating) {
            android.util.Log.d("BikeAnimation", "🚀 Auto-starting animation on attach - speed=$speed")
            startAnimation()
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopAnimation()
        // keep frames in memory, don't recycle
    }
}
