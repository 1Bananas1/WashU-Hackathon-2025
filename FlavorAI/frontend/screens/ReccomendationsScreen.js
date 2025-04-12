import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasteProfile } from '../context/TasteProfileContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Restaurant card component
const RestaurantCard = ({ restaurant }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
      {/* Restaurant image */}
      <View className="h-48 bg-gray-300 relative">
        {/* Using a placeholder image - in a real app this would be from an API */}
        <Image 
          source={{ uri: `https://source.unsplash.com/featured/?food,${restaurant.cuisine}` }} 
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }} // Fallback if className doesn't work
        />
        
        {/* Price level overlay */}
        <View className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-full px-2 py-1">
          <Text className="text-white font-medium text-xs">{restaurant.priceLevel}</Text>
        </View>
      </View>
      
      {/* Restaurant info */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">{restaurant.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-yellow-500 font-bold mr-1">{restaurant.rating}</Text>
              <View className="flex-row">
                {Array(Math.floor(restaurant.rating)).fill(0).map((_, i) => (
                  <Feather key={i} name="star" size={14} color="#F59E0B" />
                ))}
                {restaurant.rating % 1 >= 0.5 && (
                  <Feather name="star" size={14} color="#F59E0B" />
                )}
              </View>
              <Text className="text-gray-500 text-xs ml-1">({restaurant.rating})</Text>
            </View>
          </View>
          
          <View>
            <Text className="text-gray-600 text-right">{restaurant.distance}</Text>
            <Text className="text-gray-500 text-xs text-right mt-1">{restaurant.cuisine}</Text>
          </View>
        </View>
        
        <Text className="text-gray-600 mt-2">{restaurant.description}</Text>
        
        {/* Match reasons */}
        <View className="mt-3">
          <Text className="text-gray-800 font-medium mb-1">Why it matches your taste:</Text>
          <View>
            {restaurant.matchReasons.map((reason, index) => (
              <View key={index} className="flex-row items-center mt-1">
                <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                <Text className="text-gray-600 text-sm">{reason}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Expandable section */}
        <TouchableOpacity 
          onPress={() => setExpanded(!expanded)}
          className="mt-3 flex-row items-center"
        >
          <Text className="text-primary font-medium mr-1">
            {expanded ? 'Show less' : 'Show more'}
          </Text>
          <Feather 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#6366F1" 
          />
        </TouchableOpacity>
        
        {expanded && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-gray-800 font-medium mb-2">Top Dishes:</Text>
            {restaurant.topDishes.map((dish, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialCommunityIcons name="food" size={16} color="#6366F1" />
                <Text className="text-gray-700 ml-2">{dish}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// Filter button component
const FilterButton = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${
        active ? 'bg-primary' : 'bg-gray-200'
      }`}
      onPress={onPress}
    >
      <Text className={`${active ? 'text-white' : 'text-gray-700'} font-medium`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const RecommendationsScreen = ({ navigation }) => {
  const { recommendations } = useTasteProfile();
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Filter options
  const filters = ['All', 'Thai', 'Mexican', 'Indian', 'American'];
  
  // Filter recommendations based on selected filter
  const filteredRecommendations = activeFilter === 'All' 
    ? recommendations 
    : recommendations.filter(r => r.cuisine === activeFilter);
  
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header section */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-800 mb-1">
              Recommended For You
            </Text>
            <Text className="text-gray-600">
              Based on your taste profile and preferences
            </Text>
          </View>
          
          {/* Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {filters.map((filter) => (
              <FilterButton 
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onPress={() => setActiveFilter(filter)}
              />
            ))}
          </ScrollView>
          
          {/* Restaurant cards */}
          {filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((restaurant) => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={restaurant}
              />
            ))
          ) : (
            <View className="bg-white rounded-lg p-6 items-center justify-center">
              <MaterialCommunityIcons name="food-off" size={48} color="#6366F1" />
              <Text className="text-lg font-medium text-gray-800 mt-4 mb-2 text-center">
                No recommendations found
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                {activeFilter === 'All' 
                  ? "We couldn't find any recommendations based on your taste profile." 
                  : `No ${activeFilter} restaurants found that match your preferences.`}
              </Text>
              
              {activeFilter !== 'All' && (
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => setActiveFilter('All')}
                >
                  <Text className="text-primary font-medium">Show all recommendations</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* View profile button */}
          <TouchableOpacity
            className="bg-white border border-primary py-4 rounded-lg items-center mt-4"
            onPress={() => navigation.navigate('Profile')}
          >
            <Text className="text-primary font-semibold text-lg">View Your Taste Profile</Text>
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

export default RecommendationsScreen;