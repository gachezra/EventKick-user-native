import React, { useState, useContext, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, Surface } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import { loginRoute, registerRoute } from '../utils/APIRoutes';
import axios from 'axios';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [notification, setNotification] = useState(null);
  const animation = useRef(null);

  const { login } = useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (isLogin === 'register') {
        const res = await axios.post(registerRoute, {
          email, password, username
        })
        setNotification(res.data.msg)
      } else {
        const res = await axios.post(loginRoute, {
          username: email, password
        })
        login(res.data.user, res.data.token)
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const renderLogin = () => (
    <Surface style={styles.surface}>
      <Title style={styles.title}>Login</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <Button
        mode="outlined"
        onPress={handleAuth}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Login
      </Button>
    </Surface>
  );

  const renderRegister = () => (
    <Surface style={styles.surface}>
      <Title style={styles.title}>Register</Title>
      {notification ? (
        <Text style={styles.text}>{notification}</Text>
      ) : ''}
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <Button
        mode="outlined"
        onPress={handleAuth}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Register
      </Button>
    </Surface>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView>
        <SafeAreaView style={{flex: 1}}>
          <StatusBar barStyle="light-content" backgroundColor="#131324" />
          <LottieView
            autoPlay
            loop={false}
            ref={animation}
            style={{
              width: 200,
              height: 200,
              backgroundColor: 'transparent',
              alignSelf: 'center'
            }}
            source={require('../assets/login.json')}
          />
          <View style={{flexDirection: 'row', justifyContent: 'space-around', }}>
            <TouchableOpacity
              style={[styles.tab, isLogin  === 'login' && styles.activeTab]}
              onPress={() => setIsLogin('login')}
              >
              <Text style={styles.text}>LogIn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isLogin  === 'register' && styles.activeTab]}
              onPress={() => setIsLogin('register')}
              >
              <Text style={styles.text}>Create An Account</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.innerContainer}>
            {isLogin === 'login' ? renderLogin() :
              isLogin === 'register' ? renderRegister() : ''}
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const inputTheme = {
  colors: {
    primary: '#7c3aed', // Brighter indigo
    text: '#ffffff',
    placeholder: '#a78bfa', // Light purple for better visibility
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  innerContainer: {
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#1e1e36',
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#252540',
  },
  button: {
    marginTop: 10,
    borderColor: '#7c3aed',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 8,
    width: 'fill',
  },
  buttonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: 15,
    color: '#d8b4fe',
    textAlign: 'center',
    fontSize: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 1,
    borderRadius: 8
  },
  activeTab: {
    backgroundColor: '#1e1e36',
  },
  text: {
    color: '#ffffff',
    padding: 5
  },
});

export default AuthScreen;