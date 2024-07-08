import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


import LogoImage from '../assets/tunetok-logo-1.png'; 

type RootStackParamList = {
    Generate: undefined;
  };
  
  type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Generate'>;
  
  const SplashScreen: React.FC = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();
    const opacity = new Animated.Value(0);
  
    useEffect(() => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000), // Show splash screen for 2 seconds
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Navigate -> Generate screen after the animation completes
        navigation.replace('Generate');
      });
    }, []);
  
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity }]}>
          <Image 
            source={LogoImage} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1C1E52',  
    },
    content: {
      alignItems: 'center',
    },
    logo: {
      width: 200, 
      height: 200, 
    },
  });
  
  export default SplashScreen;