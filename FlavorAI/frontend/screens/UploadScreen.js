import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { useTasteProfile } from '../context/TasteProfileContext';

const UploadScreen = ({ navigation }) => {
  const { setUserData, processUserData } = useTasteProfile();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('User cancelled file picker');
        return;
      }

      // File selected successfully
      setSelectedFile(result.assets[0]);
      console.log('Selected file:', result.assets[0].name);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'There was a problem selecting the file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a file first.');
      return;
    }

    setUploading(true);

    try {
      // In a real app, you would read and process the file here
      // For the hackathon, we'll simulate reading the file
      
      // This is how you would read a file in a real implementation
      // const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
      // console.log('File content:', fileContent.substring(0, 100) + '...');
      
      // Simulate processing the data
      setTimeout(() => {
        // Create mock user data
        const mockUserData = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.mimeType,
          timestamp: new Date().toISOString(),
        };
        
        setUserData(mockUserData);
        setUploading(false);
        
        // Navigate to the processing screen
        navigation.navigate('Processing', { fileName: selectedFile.name });
        
        // Start processing the data
        processUserData(mockUserData);
      }, 1500);
    } catch (error) {
      console.error('Error reading file:', error);
      Alert.alert('Error', 'There was a problem reading the file.');
      setUploading(false);
    }
  };

  const renderInstructions = () => (
    <View className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <Text className="text-xl font-semibold text-gray-800 mb-4">
        How to get your Google Takeout data
      </Text>
      
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-800 mb-1">1. Go to Google Takeout</Text>
        <Text className="text-sm text-gray-600">
          Visit takeout.google.com and sign in with your Google account
        </Text>
      </View>
      
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-800 mb-1">2. Select data to export</Text>
        <Text className="text-sm text-gray-600">
          Select "Maps (your places)" and "My Activity" data
        </Text>
      </View>
      
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-800 mb-1">3. Choose export format</Text>
        <Text className="text-sm text-gray-600">
          Select "JSON" as the export format and create export
        </Text>
      </View>
      
      <View>
        <Text className="text-base font-medium text-gray-800 mb-1">4. Download and upload</Text>
        <Text className="text-sm text-gray-600">
          Download your data and upload the ZIP file here
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        {/* Instructions */}
        {renderInstructions()}
        
        {/* Upload section */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-6 items-center justify-center border-2 border-dashed border-gray-300">
          <Feather name="upload-cloud" size={48} color="#6366F1" />
          
          <Text className="text-lg font-medium text-gray-800 mt-4 mb-2">
            Upload your Google Takeout data
          </Text>
          
          <Text className="text-sm text-gray-600 text-center mb-6">
            We'll analyze your food preferences and create personalized recommendations
          </Text>
          
          <TouchableOpacity
            className="bg-primary py-3 px-6 rounded-lg mb-4"
            onPress={handleSelectFile}
          >
            <Text className="text-white font-semibold">Select File</Text>
          </TouchableOpacity>
          
          {selectedFile && (
            <View className="w-full">
              <View className="bg-gray-100 p-3 rounded-lg mb-4">
                <Text className="text-gray-800 font-medium">{selectedFile.name}</Text>
                <Text className="text-gray-600 text-xs mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
              
              <TouchableOpacity
                className={`${uploading ? 'bg-gray-400' : 'bg-primary'} py-3 rounded-lg items-center`}
                onPress={handleUpload}
                disabled={uploading}
              >
                <Text className="text-white font-semibold">
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Skip option */}
        <TouchableOpacity
          className="py-3 items-center"
          onPress={() => {
            // For demo purposes, skip to recommendations screen with mock data
            const mockUserData = {
              name: 'sample_data.zip',
              size: 1024 * 1024 * 2, // 2MB
              type: 'application/zip',
              timestamp: new Date().toISOString(),
            };
            
            setUserData(mockUserData);
            navigation.navigate('Processing', { fileName: 'sample_data.zip' });
            processUserData(mockUserData);
          }}
        >
          <Text className="text-primary font-medium">
            Use sample data instead
          </Text>
        </TouchableOpacity>
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
  }
});

export default UploadScreen;