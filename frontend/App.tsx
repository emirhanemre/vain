import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Define expected structure of API responses for TypeScript validation
interface HealthResponse {
  status: string;   
  service: string;  
}

// Returns user data after successful registration
interface UserResponse {
  id: number;           
  username: string;     
  email: string;        
  created_at: string;   
}

// Returns JWT token after successful login
interface LoginResponse {
  access_token: string; 
  token_type: string;   
}



// Points all API calls to your FastAPI backend
const API_BASE_URL = 'http://127.0.0.1:3000';

const Stack = createStackNavigator();


// Verifies mobile app can reach FastAPI backend
const testAPIConnection = async () => {
  try {
    console.log('🚀 Testing API connection...');
    // Calls your /healthz endpoint
    const response = await axios.get<HealthResponse>(`${API_BASE_URL}/healthz`);
    console.log('✅ API Response:', response.data);
    console.log('✅ SUCCESS: API connection working!');
    
    // Try alert, but don't rely on it
    Alert.alert('Success!', `API responded: ${response.data.status}`);
  } catch (error) {
    console.log('❌ API Error:', error);
    console.log('❌ FAILED: Could not connect to API');
    Alert.alert('Error', 'Could not connect to API');
  }
};


// Creates new user account in AWS RDS database
const testRegistration = async () => {
  try {
    console.log('Testing user registration...');
    
    // Hardcoded test data (will replace with form input later)
    const userData = {
      username: "testuser123",
      email: "test@example.com", 
      password: "testpassword123"
    };
    
    // Sends user data to registration endpoint
    const response = await axios.post<UserResponse>(`${API_BASE_URL}/auth/register`, userData);
    console.log('✅ Registration Response:', response.data);
    console.log(`✅ SUCCESS: User registered: ${response.data.username}`);
    
    // Confirms user was created successfully
    Alert.alert('Success!', `User registered: ${response.data.username}`);
  } catch (error: any) {
    console.log('❌ Registration Error:', error.response?.data || error.message);
    console.log('❌ FAILED: Registration error');
    Alert.alert('Registration Failed', error.response?.data?.detail || 'Registration error');
  }
};


// Authenticates user and receives JWT token
const testLogin = async () => {
  try {
    console.log('Testing user login...');
    
    // Uses same credentials as registration test
    const loginData = {
      username: "testuser123",
      password: "testpassword123"
    };
    
    // Sends credentials to login endpoint
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login Response:', response.data);
    console.log(`✅ SUCCESS: JWT Token received: ${response.data.access_token.substring(0, 30)}...`);
  

    // Save JWT token to device storage
    await AsyncStorage.setItem('authToken', response.data.access_token);
    console.log('💾 Token saved to AsyncStorage');

    // Shows token preview (tokens are very long, so only show first 20 chars)
    Alert.alert('Success!', `Login successful! Token received: ${response.data.access_token.substring(0, 20)}...`);
  } catch (error: any) {
    // Shows authentication errors (wrong password, user not found, etc.)
    console.log('❌ Login Error:', error.response?.data || error.message);
    console.log('❌ FAILED: Login error');
    Alert.alert('Login Failed', error.response?.data?.detail || 'Login error');
  }
};


    // Checks if user is already logged in when app starts
const checkSavedToken = async () => {
  try {
    console.log('🔍 Checking for saved authentication token...');
    const savedToken = await AsyncStorage.getItem('authToken');
    
    if (savedToken) {
      console.log('✅ Found saved token:', savedToken.substring(0, 30) + '...');
      console.log('🎉 User is already logged in!');
      return true; // User is logged in
    } else {
      console.log('❌ No saved token found - user needs to log in');
      return false; // User needs to log in
    }
  } catch (error) {
    console.error('Error checking saved token:', error);
    return false; // Error = treat as not logged in
  }
};

// Add this function to clear the saved token
const testLogout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    console.log('🗑️ Token removed - user logged out');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};





function TestingScreen({ navigation }: any) {
  // Move all your test functions here (testAPIConnection, testRegistration, etc.)
  // Copy from your current App function
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>vAIn App - Authentication Testing</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="1. Test API Connection" onPress={testAPIConnection} />
        <Button title="2. Test Registration" onPress={testRegistration} />
        <Button title="3. Test Login" onPress={testLogin} />
        <Button title="4. Check Saved Token" onPress={checkSavedToken} />
        <Button title="5. Test Logout" onPress={testLogout} />
        <Button title="6. Go to Login Screen" onPress={() => navigation.navigate('Login')} />

      </View>
    </View>
  );
}

// Creates a real login form with input fields
const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, data);
      
      await AsyncStorage.setItem('authToken', response.data.access_token);
      console.log('Login successful, token saved');
      
      Alert.alert('Success!', 'Logged in successfully!');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Login Failed', error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Login to vAIn</Text>
      
      <Controller
        control={control}
        name="username"
        rules={{ required: 'Username is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="Username"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
          />
        )}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
      
      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
      
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      />

      <Button 
        title="Back to Testing" 
        onPress={() => navigation.goBack()}
      />
      
    </View>
  );
};


export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Testing">
        <Stack.Screen name="Testing" component={TestingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,                    
    backgroundColor: '#fff',    
    alignItems: 'center',       
    justifyContent: 'center',   
  },
  title: {
    fontSize: 20,      
    marginBottom: 30,  
  },
  buttonContainer: {
    gap: 10,  
  },
  // ADD THESE NEW STYLES:
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: 300,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },

});