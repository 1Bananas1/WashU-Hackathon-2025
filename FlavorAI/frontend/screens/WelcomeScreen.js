import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="items-center mb-8">
          <Image 
            source={require('../assets/logo-placeholder.png')} 
            className="w-24 h-24 mb-4"
            style={{ width: 96, height: 96 }} // Fallback if className doesn't work
          />
          <Text className="text-3xl font-bold text-primary">FlavorAI</Text>
          <Text className="text-lg text-gray-600 text-center mt-2">
            Discover your perfect food match
          </Text>
        </View>

        {/* Main content */}
        <View className="flex-1 justify-center">
          <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              How it works
            </Text>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-4">
                <Feather name="upload" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Upload your data</Text>
                <Text className="text-sm text-gray-600">
                  Use your Google Takeout food preferences data
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-4">
                <Feather name="bar-chart-2" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Generate your profile</Text>
                <Text className="text-sm text-gray-600">
                  We analyze your preferences and eating habits
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-4">
                <MaterialCommunityIcons name="food-fork-drink" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Get recommendations</Text>
                <Text className="text-sm text-gray-600">
                  Discover new foods and restaurants you'll love
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-lg items-center mb-4"
            onPress={() => navigation.navigate('Upload')}
          >
            <Text className="text-white font-semibold text-lg">Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="border border-primary py-4 rounded-lg items-center"
            onPress={() => {
              // For demo purposes, navigate directly to recommendations
              navigation.navigate('Recommendations');
            }}
          >
            <Text className="text-primary font-semibold text-lg">Try Demo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View className="mt-6">
          <Text className="text-center text-gray-500 text-sm">
            Hackathon Project · 2025
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Fallback styles in case NativeWind doesn't work correctly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  }
});

export default WelcomeScreen;