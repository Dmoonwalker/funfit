package com.funfeetble

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * React Native ViewManager for BikeAnimationView
 * Bridges React Native props to native Android component
 */
class BikeAnimationViewManager : SimpleViewManager<BikeAnimationView>() {

    companion object {
        const val REACT_CLASS = "BikeAnimationView"
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(reactContext: ThemedReactContext): BikeAnimationView {
        return BikeAnimationView(reactContext)
    }

    /**
     * Set speed prop from React Native
     */
    @ReactProp(name = "speed", defaultFloat = 0f)
    fun setSpeed(view: BikeAnimationView, speed: Float) {
        view.setSpeed(speed)
    }

    /**
     * Set gender prop from React Native
     */
    @ReactProp(name = "gender")
    fun setGender(view: BikeAnimationView, gender: String?) {
        val genderValue = gender ?: "male"
        android.util.Log.d("BikeAnimationManager", "🧑‍🦱 ViewManager setGender called with: '$gender' -> using: '$genderValue'")
        view.setGender(genderValue)
    }

    /**
     * Set isConnected prop from React Native
     */
    @ReactProp(name = "isConnected", defaultBoolean = false)
    fun setIsConnected(view: BikeAnimationView, isConnected: Boolean) {
        // Pass connection state to native view; native decides to start/stop based on speed
        view.setIsConnected(isConnected)
    }

    /**
     * Set resizeMode prop from React Native
     */
    @ReactProp(name = "resizeMode")
    fun setResizeMode(view: BikeAnimationView, mode: String?) {
        view.setResizeMode(mode ?: "stretch")
    }

    /**
     * Set rpm prop from React Native
     */
    @ReactProp(name = "rpm", defaultFloat = 0f)
    fun setRpm(view: BikeAnimationView, rpm: Float) {
        view.setRpm(rpm)
    }

    /**
     * Set distance prop from React Native
     */
    @ReactProp(name = "distance", defaultFloat = 0f)
    fun setDistance(view: BikeAnimationView, distance: Float) {
        view.setDistance(distance)
    }

    /**
     * Set calories prop from React Native
     */
    @ReactProp(name = "calories", defaultFloat = 0f)
    fun setCalories(view: BikeAnimationView, calories: Float) {
        view.setCalories(calories)
    }

}
