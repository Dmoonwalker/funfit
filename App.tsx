import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BLEProvider } from './src/contexts/BLEContext';
import HomeScreen from './src/screens/HomeScreen';
import BLEScreen from './src/screens/BLEScreen';

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <BLEProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ 
              headerShown: false
            }}
          />
          <Stack.Screen
            name="BLE"
            component={BLEScreen}
            options={{ 
              title: 'Bluetooth Connection',
              headerShown: true
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BLEProvider>
  );
};

export default App;