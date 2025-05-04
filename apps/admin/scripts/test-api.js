const axios = require('axios');
require('dotenv').config();

// Normalize base URL by removing trailing slash if present
const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const baseUrl = normalizeBaseUrl(process.env.VITE_API_URL) || 'http://localhost:5001';
const apiUrl = `${baseUrl}/api`;

// Run the tests
async function runTests() {
  try {
    // Get your auth token (you need to be logged in as admin)
    console.log('Enter Firebase token to authenticate:');
    const token = process.env.FIREBASE_TOKEN; // For testing, you can set this in .env

    if (!token) {
      console.error('No token provided. Please set FIREBASE_TOKEN in .env or pass it as an argument.');
      process.exit(1);
    }
    
    // First, sync with the auth service to get a valid session
    console.log('Authenticating with backend...');
    const syncResponse = await axios.post(`${apiUrl}/auth/sync`, { token });
    console.log('Authentication successful!');
    
    // Save the token for future requests
    const authToken = token;
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test endpoints
    console.log('\n--- Testing Users API ---');
    const usersResponse = await axios.get(`${apiUrl}/users`, { 
      headers,
      params: { page: 1, limit: 10 }
    });
    console.log('Users API Response Structure:', JSON.stringify(usersResponse.data, null, 2));

    console.log('\n--- Testing Tracks API ---');
    const tracksResponse = await axios.get(`${apiUrl}/tracks`, { 
      headers,
      params: { page: 1, limit: 10 }
    });
    console.log('Tracks API Response Structure:', JSON.stringify(tracksResponse.data, null, 2));

    console.log('\n--- Testing Photos API ---');
    const photosResponse = await axios.get(`${apiUrl}/photos`, { 
      headers,
      params: { page: 1, limit: 10 }
    });
    console.log('Photos API Response Structure:', JSON.stringify(photosResponse.data, null, 2));

    console.log('\nAll API tests completed successfully!');
  } catch (error) {
    console.error('Error running API tests:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

runTests(); 