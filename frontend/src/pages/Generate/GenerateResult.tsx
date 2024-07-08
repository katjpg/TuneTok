import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  GenerateResult: { videoUri: string };
};

type GenerateResultRouteProp = RouteProp<RootStackParamList, 'GenerateResult'>;
type GenerateResultNavigationProp = StackNavigationProp<RootStackParamList, 'GenerateResult'>;

interface GenerateResultProps {
  route: GenerateResultRouteProp;
}

const GenerateResult: React.FC<GenerateResultProps> = ({ route }) => {
  const { videoUri } = route.params;
  const navigation = useNavigation<GenerateResultNavigationProp>();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if ('isPlaying' in status) {
      setIsPlaying(status.isPlaying);
    }
  };

  const handleDownload = () => {
    console.log('Download button pressed');
    // Implement download functionality
  };

  const handleShare = () => {
    console.log('Share button pressed');
    // Implement share functionality
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.navigate('Home')}
        accessibilityLabel="Close and return to home"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>      
      <Text style={styles.generatedText}>Your Generated</Text>
      <Text style={styles.title}>TuneTok!</Text>
      
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode="cover"
          isLooping
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={togglePlayPause}
          accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={40} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.downloadButton} 
        onPress={handleDownload}
        accessibilityLabel="Download video"
      >
        <Ionicons name="download-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Download</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={handleShare}
        accessibilityLabel="Share video"
      >
        <Text style={styles.shareButtonText}>Share</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 45,
    left: 25,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#1e2761',
    alignItems: 'center',
    padding: 20,
  },
  generatedText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  title: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  videoContainer: {
    width: width - 40,
    height: (width - 140) * 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    padding: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff2d55',
    borderRadius: 9,
    paddingVertical: 13,
    paddingHorizontal: 65,
    marginBottom: 15,
    height: 50,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  shareButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 9,
    paddingVertical: 15,
    paddingHorizontal: 100,
    height: 50,
  },
  shareButtonText: {
    color: '#1e2761',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GenerateResult;