import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import UploadScreen from './screens/UploadScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecommendationsScreen from './screens/ReccomendationsScreen';
import ProcessingScreen from './screens/ProcessingScreens';

// Create a context to store user data and taste profile
import { TasteProfileProvider } from './context/TasteProfileContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <TasteProfileProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6366F1', // indigo-600
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ title: 'FlavorAI' }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen} 
              options={{ title: 'Upload Data' }}
            />
            <Stack.Screen 
              name="Processing" 
              component={ProcessingScreen}
              options={{ title: 'Analyzing Data' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Your Taste Profile' }}
            />
            <Stack.Screen 
              name="Recommendations" 
              component={RecommendationsScreen}
              options={{ title: 'Recommended For You' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TasteProfileProvider>
    </SafeAreaProvider>
  );
}