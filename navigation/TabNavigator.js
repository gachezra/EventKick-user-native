import React from 'react';
import { Provider } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import CameraScreen from '../screens/CameraScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = ()=> {
  return (
    <Provider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Discover') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Events') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Memories') {
              iconName = focused ? 'images' : 'images-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'indigo',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#131324', borderTopWidth: 0, }, 
          headerShown: false,
        })}
      >
        <Tab.Screen name="Discover" component={HomeScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="Memories" component={CameraScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </Provider>
  );
}

export default TabNavigator;


// import React, { useContext } from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import HomeScreen from '../screens/HomeScreen';
// import EventsScreen from '../screens/EventsScreen';
// import FilesScreen from '../screens/FilesScreen';
// import UploadScreen from '../screens/UploadScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import EventDetails from '../screens/EventDetails';
// import AuthScreen from '../screens/AuthScreen';
// import ForumScreen from '../screens/ForumScreen';
// import ThreadScreen from '../screens/ThreadScreen';
// import { AuthContext } from '../context/AuthContext';
// import { Ionicons } from '@expo/vector-icons'; 
// import CameraScreen from '../screens/CameraScreen';
// import MemoriesScreen from '../screens/MemoriesScreen';
// // import Photo from '../screens/Photo';

// const Tab = createBottomTabNavigator();
// const Stack = createStackNavigator();

// // Home Stack with Event Details
// const HomeStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Home" component={HomeScreen} />
//       <Stack.Screen name="EventDetails" component={EventDetails} />
//       <Stack.Screen name="Forums" component={ForumScreen} />
//       <Stack.Screen name="Thread" component={ThreadScreen} />
//     </Stack.Navigator>
//   );
// };

// const EventsStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Calendar" component={EventsScreen} />
//       <Stack.Screen name="Upload" component={UploadScreen} />
//       <Stack.Screen name="EventDetails" component={EventDetails} />
//       <Stack.Screen name="Forums" component={ForumScreen} />
//       <Stack.Screen name="Thread" component={ThreadScreen} />
//     </Stack.Navigator>
//   );
// };

// const CameraStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Camera" component={CameraScreen} />
//       <Stack.Screen name="Gallery" component={MemoriesScreen} />
//     </Stack.Navigator>
//   );
// };

// const UploadStack = () => {
//   return(
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Upload" component={UploadScreen} />
//       <Stack.Screen name="Files" component={FilesScreen} />
//     </Stack.Navigator>
//   )
// }

// const TabNavigator = () => {
//   const { user } = useContext(AuthContext);

//   if (!user) {
//     return <AuthScreen />; 
//   }

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           if (route.name === 'Discover') {
//             iconName = focused ? 'home' : 'home-outline';
//           } else if (route.name === 'Events') {
//             iconName = focused ? 'calendar' : 'calendar-outline';
//           } else if (route.name === 'Profile') {
//             iconName = focused ? 'person' : 'person-outline';
//           } else if (route.name === 'Memories') {
//             iconName = focused ? 'images' : 'images-outline';
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: 'indigo',
//         tabBarInactiveTintColor: 'gray',
//         tabBarStyle: { backgroundColor: '#131324' }, 
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Discover" component={HomeStack} />
//       <Tab.Screen name="Events" component={EventsStack} />
//       <Tab.Screen name="Memories" component={CameraStack} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// };

// export default TabNavigator;


// import React, { useContext } from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import HomeScreen from '../screens/HomeScreen';
// import EventsScreen from '../screens/EventsScreen';
// import UploadScreen from '../screens/UploadScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import EventDetails from '../screens/EventDetails';
// import LoginScreen from '../screens/LoginScreen';
// import ForumScreen from '../screens/ForumScreen';
// import { AuthContext } from '../context/AuthContext';
// import { Ionicons } from '@expo/vector-icons'; 
// import CameraScreen from '../screens/CameraScreen';
// import MemoriesScreen from '../screens/MemoriesScreen';
// import { StyleSheet, Platform } from 'react-native';

// const Tab = createBottomTabNavigator();
// const Stack = createStackNavigator();

// const HomeStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Home" component={HomeScreen} />
//       <Stack.Screen name="EventDetails" component={EventDetails} />
//       <Stack.Screen name="Forums" component={ForumScreen} />
//     </Stack.Navigator>
//   );
// };

// const EventsStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Calendar" component={EventsScreen} />
//       <Stack.Screen name="Upload" component={UploadScreen} />
//       <Stack.Screen name="EventDetails" component={EventDetails} />
//       <Stack.Screen name="Forums" component={ForumScreen} />
//     </Stack.Navigator>
//   );
// };

// const UploadStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Camera" component={CameraScreen} />
//       <Stack.Screen name="Gallery" component={MemoriesScreen} />
//     </Stack.Navigator>
//   );
// };

// const TabNavigator = () => {
//   const { user } = useContext(AuthContext);

//   if (!user) {
//     return <LoginScreen />; 
//   }

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           if (route.name === 'Discover') {
//             iconName = focused ? 'home' : 'home-outline';
//           } else if (route.name === 'Events') {
//             iconName = focused ? 'calendar' : 'calendar-outline';
//           } else if (route.name === 'Profile') {
//             iconName = focused ? 'person' : 'person-outline';
//           } else if (route.name === 'Memories') {
//             iconName = focused ? 'images' : 'images-outline';
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: 'indigo',
//         tabBarInactiveTintColor: 'gray',
//         tabBarStyle: styles.tabBar, // Apply floating tab bar style
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Discover" component={HomeStack} />
//       <Tab.Screen name="Events" component={EventsStack} />
//       <Tab.Screen name="Memories" component={UploadStack} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// };

// const styles = StyleSheet.create({
//   tabBar: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     right: 20,
//     elevation: 5, // Android shadow
//     backgroundColor: '#131324cc', // Transparent background (80% opacity)
//     borderRadius: 15,
//     height: 80,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowOffset: { width: 0, height: 10 },
//     shadowRadius: 10, // iOS shadow
//     borderTopWidth: 0, // Remove top border for a cleaner look
//   },
// });

// export default TabNavigator;
