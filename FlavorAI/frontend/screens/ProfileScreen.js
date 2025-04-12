import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasteProfile } from '../context/TasteProfileContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Component to render a preference meter
const PreferenceMeter = ({ label, value, color }) => {
  // Convert string values to numbers
  const getValuePercentage = () => {
    switch(value) {
      case 'Very Low': return 10;
      case 'Low': return 30;
      case 'Medium-Low': return 45;
      case 'Medium': return 50;
      case 'Medium-High': return 70;
      case 'High': return 85;
      case 'Very High': return 95;
      default: return 50;
    }
  };
  
  const percentage = getValuePercentage();
  
  return (
    <View className="mb-6">
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-800 font-medium">{label}</Text>
        <Text className="text-gray-600">{value}</Text>
      </View>
      <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <View 
          className={`h-full ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-gray-500">Low</Text>
        <Text className="text-xs text-gray-500">High</Text>
      </View>
    </View>
  );
};

// Component to render a tag (for cuisines, dietary restrictions, etc.)
const Tag = ({ text, type = 'default' }) => {
  const getColorClass = () => {
    switch(type) {
      case 'cuisine': 
        return 'bg-indigo-100 text-indigo-800';
      case 'restriction': 
        return 'bg-red-100 text-red-800';
      case 'preference': 
        return 'bg-green-100 text-green-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <View className={`rounded-full px-3 py-1 mr-2 mb-2 ${getColorClass()}`}>
      <Text className="text-sm font-medium">{text}</Text>
    </View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const { tasteProfile } = useTasteProfile();
  
  // If no taste profile exists, show an error message
  if (!tasteProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 p-6 justify-center items-center">
          <Text className="text-lg text-gray-800 mb-4 text-center">
            No taste profile available. Please upload your data first.
          </Text>
          <TouchableOpacity
            className="bg-primary py-3 px-6 rounded-lg"
            onPress={() => navigation.navigate('Upload')}
          >
            <Text className="text-white font-semibold">Go to Upload</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Profile Header */}
          <View className="bg-primary rounded-lg p-6 mb-6">
            <Text className="text-white text-2xl font-bold mb-2">Your Taste Profile</Text>
            <Text className="text-white opacity-80">
              Based on your dining history and preferences
            </Text>
          </View>
          
          {/* Flavor Preferences Section */}
          <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons name="chili-mild" size={24} color="#6366F1" />
              <Text className="text-xl font-semibold text-gray-800 ml-2">
                Flavor Preferences
              </Text>
            </View>
            
            <PreferenceMeter 
              label="Spice Level" 
              value={tasteProfile.spicePreference} 
              color="bg-red-500" 
            />
            
            <PreferenceMeter 
              label="Salt Level" 
              value={tasteProfile.saltPreference} 
              color="bg-blue-500" 
            />
            
            <PreferenceMeter 
              label="Sweetness" 
              value={tasteProfile.sweetnessPreference} 
              color="bg-yellow-500" 
            />
            
            <PreferenceMeter 
              label="Bitterness" 
              value={tasteProfile.bitterPreference} 
              color="bg-green-500" 
            />
            
            <PreferenceMeter 
              label="Sourness" 
              value={tasteProfile.sourPreference} 
              color="bg-purple-500" 
            />
            
            <PreferenceMeter 
              label="Umami" 
              value={tasteProfile.umamiPreference} 
              color="bg-orange-500" 
            />
          </View>
          
          {/* Cuisine Preferences */}
          <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons name="food-variant" size={24} color="#6366F1" />
              <Text className="text-xl font-semibold text-gray-800 ml-2">
                Favorite Cuisines
              </Text>
            </View>
            
            <View className="flex-row flex-wrap">
              {tasteProfile.favoriteEthnicCuisines.map((cuisine, index) => (
                <Tag key={index} text={cuisine} type="cuisine" />
              ))}
            </View>
          </View>
          
          {/* Dietary Restrictions */}
          {tasteProfile.dietaryRestrictions && tasteProfile.dietaryRestrictions.length > 0 && (
            <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <View className="flex-row items-center mb-4">
                <Feather name="alert-circle" size={24} color="#6366F1" />
                <Text className="text-xl font-semibold text-gray-800 ml-2">
                  Dietary Restrictions
                </Text>
              </View>
              
              <View className="flex-row flex-wrap">
                {tasteProfile.dietaryRestrictions.map((restriction, index) => (
                  <Tag key={index} text={restriction} type="restriction" />
                ))}
              </View>
            </View>
          )}
          
          {/* Frequently Ordered */}
          {tasteProfile.frequentlyOrderedDishes && (
            <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#6366F1" />
                <Text className="text-xl font-semibold text-gray-800 ml-2">
                  Frequently Ordered
                </Text>
              </View>
              
              <View className="flex-row flex-wrap">
                {tasteProfile.frequentlyOrderedDishes.map((dish, index) => (
                  <Tag key={index} text={dish} type="preference" />
                ))}
              </View>
            </View>
          )}
          
          {/* Visit Frequency */}
          {tasteProfile.visitFrequency && (
            <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <View className="flex-row items-center mb-4">
                <Feather name="clock" size={24} color="#6366F1" />
                <Text className="text-xl font-semibold text-gray-800 ml-2">
                  Visit Patterns
                </Text>
              </View>
              
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-700">Breakfast</Text>
                  <Text className="text-gray-600">{tasteProfile.visitFrequency.breakfast}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-700">Lunch</Text>
                  <Text className="text-gray-600">{tasteProfile.visitFrequency.lunch}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-700">Dinner</Text>
                  <Text className="text-gray-600">{tasteProfile.visitFrequency.dinner}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-700">Dessert/Snacks</Text>
                  <Text className="text-gray-600">{tasteProfile.visitFrequency.dessert}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Action Buttons */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-lg items-center mb-4"
            onPress={() => navigation.navigate('Recommendations')}
          >
            <Text className="text-white font-semibold text-lg">View Recommendations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="border border-primary py-4 rounded-lg items-center"
            onPress={() => navigation.navigate('Upload')}
          >
            <Text className="text-primary font-semibold text-lg">Update Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Fallback styles in case NativeWind doesn't work correctly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  }
});

export default ProfileScreen;