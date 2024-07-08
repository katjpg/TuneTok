import React, { useState, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { Entypo, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHome, faMagnifyingGlass, faMessage, faUser } from '@fortawesome/free-solid-svg-icons';
import { faMessage as faMessageRegular } from '@fortawesome/free-regular-svg-icons';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { Provider } from 'react-native-paper';

// Add FontAwesome icons to the library
library.add(fas);
// Import your screen components
import Home from '../pages/Home';
import Discover from '../pages/Discover';
import Generate from '../pages/Generate/Generate';
import Record from '../pages/Record';
import Inbox from '../pages/Inbox';
import Me from '../pages/Me';
import GenerateResult from '../pages/Generate/GenerateResult';


// Import custom components
import HomeButton from '../components/HomeButton';
import SplashScreen from '../components/SplashScreen';
import PreRecord from '../components/PreRecord';

// Define the param list for the root stack
type RootStackParamList = {
  Main: undefined;
  PreRecord: undefined;
  Record: undefined;
  Generate: undefined;
  SplashScreen: undefined;
  GenerateResult: { videoUri: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createMaterialBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const [home, setHome] = useState(true);

  useEffect(() => {
    if (home) {
      StatusBar.setHidden(true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#ffd8b3');
        StatusBar.setBarStyle('dark-content');
      }
    } else {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor('#fff2e6');
    }
  }, [home]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      shifting={false}
      activeColor="#fd2b55"
      inactiveColor="#596068"
      barStyle={{ backgroundColor: '#ffffff' }}
      sceneAnimationEnabled={true}
      sceneAnimationType="shifting"
    >
      <Tab.Screen
        name="Home"
        component={Home}
        listeners={{
          focus: () => setHome(true),
          blur: () => setHome(false),
        }}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faHome} color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={Discover}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faMagnifyingGlass} color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="PreRecord"
        component={PreRecord}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('PreRecord');
          },
        })}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => <HomeButton home={home} />,
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={Inbox}
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faMessageRegular} color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Me"
        component={Me}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faUser} color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootStackScreen: React.FC = () => {
  return (
    <Provider theme={{ colors: { secondaryContainer: "#ffffff" } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="PreRecord"
          component={PreRecord}
          options={{
            presentation: 'transparentModal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="Record" component={Record} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="Generate" component={Generate} />
        <Stack.Screen name="GenerateResult" component={GenerateResult} />
      </Stack.Navigator>
    </Provider>
  );
};

export default RootStackScreen;