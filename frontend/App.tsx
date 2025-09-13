import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, TextInput, TouchableOpacity  } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
  refresh_token: string
  token_type: string;  
  expires_in: number; 
}

// Returns tokens from refresh endpoint
interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Token management functions
const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem('access_token', accessToken);
    await AsyncStorage.setItem('refresh_token', refreshToken);
    console.log('💾 Both tokens saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('authToken'); // Remove old token too
    console.log('🗑️ All tokens cleared');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response, // If request succeeds, do nothing
  async (error) => {
    const originalRequest = error.config;
    
    // If we get 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await getRefreshToken();
        
        if (refreshToken) {
          console.log('Access token expired, refreshing...');
          
          // Call refresh endpoint
          const refreshResponse = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          // Save new tokens
          await saveTokens(
            refreshResponse.data.access_token, 
            refreshResponse.data.refresh_token
          );
          
          console.log('Tokens refreshed successfully');
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.log('Refresh failed, user needs to login again');
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);


// Points all API calls to your FastAPI backend
const API_BASE_URL = 'http://127.0.0.1:3000';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


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
    
    const loginData = {
      username: "testuser123",
      password: "testpassword123"
    };
    
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login Response:', response.data);
    console.log(`✅ ACCESS TOKEN: ${response.data.access_token.substring(0, 30)}...`);
    console.log(`✅ REFRESH TOKEN: ${response.data.refresh_token.substring(0, 30)}...`);

    // Save BOTH tokens
    await saveTokens(response.data.access_token, response.data.refresh_token);

    Alert.alert('Success!', 
      `Login successful!\nBoth tokens saved!\nAccess: ${response.data.access_token.substring(0, 20)}...`
    );
  } catch (error: any) {
    console.log('❌ Login Error:', error.response?.data || error.message);
    Alert.alert('Login Failed', error.response?.data?.detail || 'Login error');
  }
};

// Test automatic token refresh
const testAutoRefresh = async () => {
  try {
    console.log('Testing automatic token refresh...');
    
    // First, login to get tokens
    await testLogin();
    
    // Get the access token and modify it to be "expired" 
    const accessToken = await getAccessToken();
    if (accessToken) {
      // Save an obviously invalid token to trigger 401
      await AsyncStorage.setItem('access_token', 'invalid_token_to_trigger_refresh');
      console.log('🔄 Set invalid access token to trigger refresh');
      
      // Make an API call that requires authentication (this should trigger refresh)
      const response = await axios.get(`${API_BASE_URL}/healthz`, {
        headers: {
          Authorization: `Bearer invalid_token`
        }
      });
      
      console.log('✅ Auto-refresh should have happened!');
      Alert.alert('Success!', 'Automatic token refresh working!');
    }
  } catch (error: any) {
    console.log('❌ Auto-refresh test error:', error.response?.data || error.message);
    Alert.alert('Auto-refresh Test', 'Check console for details');
  }
};


    // Checks if user is already logged in when app starts
const checkSavedToken = async () => {
  try {
    console.log('🔍 Checking for saved authentication token...');
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    
    if (accessToken && refreshToken) {
      console.log('✅ Found both tokens:', accessToken.substring(0, 30) + '...');
      console.log('🎉 User is already logged in!');
      return true; // User is logged in
    } else {
      console.log('❌ No saved tokens found - user needs to log in');
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
    await clearTokens();
    console.log('🗑️ All tokens removed - user logged out');
    Alert.alert('Success!', 'Logged out successfully!');
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
        <Button title="7. Test Auto-Refresh" onPress={testAutoRefresh} />

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
      
      await saveTokens(response.data.access_token, response.data.refresh_token);
      console.log('Login successful, both tokens saved');
      
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


function CustomHeader() {
  return (
    <View style={styles.topHeader}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => console.log('Menu pressed!')}
      >
        <Text>☰</Text>
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <View style={styles.logoSquare}></View>
      </View>

      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => console.log('Messages pressed!')}
      >
        <Text>💬</Text>
      </TouchableOpacity>
    </View>
  );
}


function HomeScreen() {
  return (
    <View style={styles.screenContainer}>
      <CustomHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Home Feed</Text>
        <Text>AI videos will appear here (like TikTok)</Text>
      </View>
    </View>
  );
}

function CreateScreen() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader />
      <View style={styles.topContent}>
        <Text style={styles.title}>Create</Text>
        
        {/* Character Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('character')}
        >
          <Text style={styles.sectionTitle}>Create Character</Text>
          <Text>{expandedSection === 'character' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {expandedSection === 'character' && (
          <View style={styles.sectionContent}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewPlaceholder}>Character preview</Text>
            </View>
            <TextInput 
              style={styles.characterInput}
              placeholder="Describe your character..."
              multiline={true}
            />
          </View>
        )}

        {/* Video Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('video')}
        >
          <Text style={styles.sectionTitle}>Generate Video</Text>
          <Text>{expandedSection === 'video' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {expandedSection === 'video' && (
          <View style={styles.sectionContent}>
            <Text>Video generation options will go here</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <CustomHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text>User profile and settings</Text>
      </View>
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={styles.screenContainer}>
      <CustomHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Search & Discover</Text>
        <Text>Find AI videos and creators</Text>
      </View>
    </View>
  );
}

function MainApp() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Testing" component={TestingScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

    </Tab.Navigator>
  );
}

export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainApp">
        <Stack.Screen name="Testing" component={TestingScreen} />
        <Stack.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />
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

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  topContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },

  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,           // Makes it circular (half of width/height)
    backgroundColor: '#000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSquare: {
    width: 32,
    height: 32 ,
    backgroundColor: '#000',     // Black square
    borderRadius: 3,
  },

previewContainer: {
  width: '100%',
  height: 200,
  backgroundColor: '#f5f5f5',
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#ddd',
},
previewPlaceholder: {
  color: '#999',
  fontSize: 16,
},
inputContainer: {
  width: '90%',
  marginBottom: 20,
},
characterInput: {
  height: 100,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 12,
  padding: 15,
  fontSize: 16,
  textAlignVertical: 'top',
},

sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
  backgroundColor: '#f8f8f8',
  borderRadius: 8,
  marginBottom: 10,
  width: '90%',
},
sectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
},
sectionContent: {
  width: '90%',
  padding: 15,
  backgroundColor: '#fff',
  borderRadius: 8,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#ddd',
},

headerButton: {
  width: 30,
  height: 30,
  justifyContent: 'center',
  alignItems: 'center',
},

});