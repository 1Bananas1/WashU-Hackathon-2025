import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasteProfile } from '../context/TasteProfileContext';

const ProcessingScreen = ({ navigation, route }) => {
  const { tasteProfile } = useTasteProfile();
  const { fileName } = route.params || { fileName: 'your data' };
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  
  // Animation value for progress bar
  const progressAnim = new Animated.Value(0);
  
  // Update progress bar width with animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  // Simulate data processing
  useEffect(() => {
    // If taste profile is ready, navigate to profile screen
    if (tasteProfile) {
      navigation.replace('Profile');
      return;
    }
    
    // Otherwise, simulate processing with progress updates
    const steps = [
      { progress: 0.1, message: 'Reading file data...' },
      { progress: 0.2, message: 'Extracting location history...' },
      { progress: 0.3, message: 'Analyzing restaurant visits...' },
      { progress: 0.4, message: 'Processing food preferences...' },
      { progress: 0.5, message: 'Identifying favorite cuisines...' },
      { progress: 0.6, message: 'Detecting flavor preferences...' },
      { progress: 0.7, message: 'Evaluating dining patterns...' },
      { progress: 0.8, message: 'Generating taste profile...' },
      { progress: 0.9, message: 'Finding recommendations...' },
      { progress: 1.0, message: 'Complete!' },
    ];
    
    // Update progress and message at intervals
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        setStatusMessage(steps[currentStep].message);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Slower updates for demo visual effect
    
    return () => clearInterval(interval);
  }, [tasteProfile, navigation]);
  
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6 justify-center">
        <View className="bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-xl font-semibold text-gray-800 text-center mb-8">
            Analyzing Your Food Preferences
          </Text>
          
          {/* Progress bar */}
          <View className="h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
            <Animated.View 
              className="h-full bg-primary"
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          
          <Text className="text-right text-gray-600 mb-6">
            {Math.round(progress * 100)}%
          </Text>
          
          {/* Status message */}
          <View className="items-center">
            <Text className="text-gray-800 font-medium text-center mb-1">
              {statusMessage}
            </Text>
            <Text className="text-gray-600 text-sm text-center">
              Processing {fileName}
            </Text>
          </View>
          
          {/* Processing details */}
          <View className="mt-8 bg-gray-50 p-4 rounded-lg">
            <Text className="text-sm text-gray-600 mb-2">
              What we're analyzing:
            </Text>
            <View className="ml-2">
              <Text className="text-sm text-gray-700 mb-1">
                • Restaurant visit history
              </Text>
              <Text className="text-sm text-gray-700 mb-1">
                • Food ordering patterns
              </Text>
              <Text className="text-sm text-gray-700 mb-1">
                • Reviews and ratings you've given
              </Text>
              <Text className="text-sm text-gray-700 mb-1">
                • Geographic preferences
              </Text>
              <Text className="text-sm text-gray-700">
                • Seasonal dining habits
              </Text>
            </View>
          </View>
          
          <Text className="text-xs text-gray-500 text-center mt-8">
            Your data is processed locally and is not shared with any third parties.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles for animations and fallbacks
const styles = StyleSheet.create({
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    justifyContent: 'center',
  }
});

export default ProcessingScreen;