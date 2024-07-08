import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Image } from 'react-native';
import FileImage from '../../assets/file-img.png';

type RootStackParamList = {
  Home: undefined;
  GenerateResult: { videoUri: string };
};

type GenerateScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GenerateResult'>;

const Generate: React.FC = () => {
  const navigation = useNavigation<GenerateScreenNavigationProp>();
  const [videoAsset, setVideoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [style, setStyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to upload a video.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
        if (fileExtension === 'mp4' || fileExtension === 'mov') {
          setVideoAsset(asset);
        } else {
          Alert.alert("Invalid File Type", "Please select a .mp4 or .mov file");
        }
      }
    } catch (err) {
      console.error("Error picking video:", err);
      Alert.alert("Error", "An error occurred while picking the video. Please try again.");
    }
  };

  const simulateVideoUpload = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Video upload simulated');
        resolve();
      }, 3000); // Simulating a 2 second upload
    });
  };

  const handleGenerate = async () => {
    if (!videoAsset) {
      Alert.alert("No Video", "Please upload a video first");
      return;
    }
    if (!style.trim()) {
      Alert.alert("No Style", "Please enter a style");
      return;
    }

    setIsLoading(true);
    try {
      await simulateVideoUpload();
      
      // Using a dummy URL for now
      const dummyVideoUrl = 'https://firebasestorage.googleapis.com/v0/b/tunetok-fae3c.appspot.com/o/demo-scene-1.mp4?alt=media&token=39645e57-97ea-4a38-a3cf-e6af50adb3c7';
      
      // Navigate to Generate Result page with the dummy video URL
      navigation.navigate('GenerateResult', { videoUri: dummyVideoUrl });
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during generation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Upload Video</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickVideo} disabled={isLoading}>
        <Image 
          source={FileImage} 
          style={styles.uploadIcon}
          resizeMode="contain"
        />
        <Text style={styles.uploadText}>
          {videoAsset ? 'Video selected' : 'Click to upload your video'}
        </Text>
      </TouchableOpacity>
      {videoAsset && (
        <Text style={styles.fileInfo}>
          Selected: {videoAsset.fileName || 'Unknown'} ({(videoAsset.fileSize / 1024 / 1024).toFixed(2)} MB)
        </Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Style</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter style..."
        placeholderTextColor="#AAB6C1"
        value={style}
        onChangeText={setStyle}
        maxLength={100}
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[styles.generateButton, isLoading && styles.generateButtonDisabled]} 
        onPress={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="flash-outline" size={24} color="#fff" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1E52',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 42,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 18,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 240, 
    backgroundColor: '#27295b',
  },

  uploadText: {
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  uploadIcon: {
    width: 100,
    height: 100,
  },
  
  fileInfo: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 10,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#3a4a8c',
    marginVertical: 24,
  },
  input: {
    backgroundColor: '#27295b',
    borderRadius: 8,
    height: 50,
    padding: 15,
    color: '#fff',
    marginTop: 4,
    marginBottom: 36,
  },
  generateButton: {
    backgroundColor: '#ff2d55',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
});

export default Generate;