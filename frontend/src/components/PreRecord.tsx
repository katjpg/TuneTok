import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

type RootStackParamList = {
  PreRecord: undefined;
  Record: undefined;
  SplashScreen: undefined;
};

type PreRecordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PreRecord'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.45;

const PreRecord: React.FC = () => {
  const navigation = useNavigation<PreRecordScreenNavigationProp>();
  const isFocused = useIsFocused();
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleOpenCamera = () => {
    dismissModal();
    navigation.navigate('Record');
  };

  const handleGenerateTuneTok = () => {
    dismissModal();
    navigation.navigate('SplashScreen');
  };

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      if (nativeEvent.translationY > 100) {
        dismissModal();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const dismissModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      navigation.goBack();
    });
  };

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isFocused]);

  if (!isFocused) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={dismissModal}
      />
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Create</Text>
          <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>OR</Text>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateTuneTok}>
            <Text style={styles.buttonText}>Generate TuneTok</Text>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  grabber: {
    width: 60,
    height: 6,
    backgroundColor: '#D3D3D3',
    borderRadius: 3,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 45,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FE2C55',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
    opacity: 0.5,
  },
  generateButton: {
    backgroundColor: '#00f2ea',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  }
});

export default PreRecord;