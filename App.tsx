import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/contexts/AuthContext';
import { BLEProvider } from './src/contexts/BLEContext';
import HomeScreen from './src/screens/HomeScreen';
import BLEScreen from './src/screens/BLEScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { View, ActivityIndicator } from 'react-native';
import ProfileScreen from './src/screens/ProfileScreen';
import SessionHistoryScreen from './src/screens/SessionHistoryScreen';

const Stack = createStackNavigator();

const MainAppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, isOnboardingCompleted } = useAuth();

  // Navigation logic: check onboarding completion from database
  const initialRoute = isAuthenticated
    ? (isOnboardingCompleted ? "Home" : "Onboarding")
    : "Welcome";

  console.log('🧭 Navigation Logic:', {
    isAuthenticated,
    isOnboardingCompleted,
    initialRoute
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#20A446" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{ gestureEnabled: false }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BLE"
        component={BLEScreen}
        options={{
          title: 'Bluetooth Connection',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Badges"
        component={BadgesScreen}
        options={{
          title: 'Achievements',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Your Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SessionHistory"
        component={SessionHistoryScreen}
        options={{
          title: 'Session History',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ gestureEnabled: false }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="MainApp"
          component={MainAppNavigator}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BLEProvider>
          <RootNavigator />
        </BLEProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;