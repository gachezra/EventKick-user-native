import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventDetails from '../screens/EventDetails';
import AuthScreen from '../screens/AuthScreen';
import ForumScreen from '../screens/ForumScreen';
import ThreadScreen from '../screens/ThreadScreen';
import OnboardLoading from '../screens/OnboardLoading';
import TicketScreen from '../screens/TicketScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';
import EventMediaScreen from '../screens/EventMediaScreen';
import EventReelsScreen from '../screens/EventReelsScreen';
import { AuthContext } from '../context/AuthContext';
import MapsView from '../screens/MapScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const { token } = useContext(AuthContext);

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name='loading' component={OnboardLoading} options={{ headerShown: false }} />
          <Stack.Screen name='HomeTab' component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="EventDetails" component={EventDetails} options={{ headerShown: false }} />
          <Stack.Screen name="Forums" component={ForumScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Thread" component={ThreadScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Gallery" component={MemoriesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EventMedia" component={EventMediaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Tickets" component={TicketScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Pics" component={GalleryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Maps" component={MapsView} options={{headerShown: false}} />
          <Stack.Screen name="Reels" component={EventReelsScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name='loading' component={OnboardLoading} options={{ headerShown: false }} />
          <Stack.Screen name='login' component={AuthScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;