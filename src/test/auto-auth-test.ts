import axios from 'axios';
import { ethers } from 'ethers';

// Create a test wallet with a fixed private key for reproducible tests
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const wallet = new ethers.Wallet(PRIVATE_KEY);
const walletAddress = wallet.address;

console.log('Using test wallet:');
console.log('Address:', walletAddress);
console.log('Private key:', PRIVATE_KEY);
console.log('-----------------------------------');

// Base API URL
const PORT = process.env.PORT || 3000;
// const API_URL = `http://localhost:${PORT}/api`;
const API_URL = "http://ec2-3-83-215-13.compute-1.amazonaws.com/api"

console.log(`Using API URL: ${API_URL}`);

/**
 * Test authentication process - positive scenario
 */
async function testAuthentication() {
  try {
    // Check if the server is available
    console.log('Checking server availability...');
    try {
      // Check server availability via /health endpoint
      await axios.get(`http://ec2-3-83-215-13.compute-1.amazonaws.com/api/health`);
      console.log('Server is available!');
    } catch (error) {
      console.error('Server is not available. Make sure the server is running on port', PORT);
      console.error('Try starting the server with: npm run dev');
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.message);
      }
      return;
    }
    console.log('Starting authentication test...');

    // Step 1: Get nonce
    console.log('Requesting nonce...');
    const nonceResponse = await axios.get(`${API_URL}/auth/nonce/${walletAddress}`);
    const { nonce, message } = nonceResponse.data;

    console.log('Received nonce:', nonce);
    console.log('Message to sign:', message);

    // Step 2: Sign the message
    console.log('Signing message...');
    const signature = await wallet.signMessage(message);

    console.log('Signature:', signature);

    // Step 3: Verify signature
    console.log('Verifying signature...');
    const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
      walletAddress,
      signature
    });

    const { token } = verifyResponse.data;

    console.log('Authentication successful!');
    console.log('JWT token:', token);
    console.log('-----------------------------------');

    // Step 4: Test protected endpoint for getting user cards using token
    console.log('Testing user cards endpoint...');
    const myCardsResponse = await axios.get(
      `${API_URL}/cards/my`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('User cards:', myCardsResponse.data);

    // Step 5: Verify we received the correct data
    if (myCardsResponse.data.success) {
      console.log(`Received ${myCardsResponse.data.count} user cards`);
      if (myCardsResponse.data.count > 0) {
        console.log('Card example:', myCardsResponse.data.data[0]);
      }
    } else {
      console.log('Failed to get user cards:', myCardsResponse.data.error);
    }

    console.log('Authentication test completed successfully!');
  } catch (error) {
    console.error('Error during authentication test:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
    } else {
      console.error(error);
    }
  }
}

/**
 * Test negative scenario - accessing protected endpoint without valid token
 */
async function testNegativeScenario() {
  try {
    console.log('\n-----------------------------------');
    console.log('Starting negative scenario test...');

    // Step 1: Try to access protected endpoint without token
    console.log('Testing access to protected endpoint without token...');
    try {
      await axios.get(`${API_URL}/cards/my/cards`);
      console.log('ERROR: Access was granted without token! This is a security issue.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('Success: Access denied without token as expected (401 Unauthorized)');
      } else if (error instanceof Error) {
        console.error('Unexpected error when testing without token:', error.message);
      } else {
        console.error('Unexpected error when testing without token');
      }
    }

    // Step 2: Try to access protected endpoint with invalid token
    console.log('\nTesting access with invalid token...');
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRBZGRyZXNzIjoiMHgxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature';

    try {
      await axios.get(
        `${API_URL}/cards/my/cards`,
        {
          headers: {
            Authorization: `Bearer ${invalidToken}`
          }
        }
      );
      console.log('ERROR: Access was granted with invalid token! This is a security issue.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('Success: Access denied with invalid token as expected (401 Unauthorized)');
      } else if (error instanceof Error) {
        console.error('Unexpected error when testing with invalid token:', error.message);
      } else {
        console.error('Unexpected error when testing with invalid token');
      }
    }

    console.log('\nNegative scenario test completed successfully!');
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error during negative scenario test:');
    console.error(error);
  }
}

// Run tests
async function runAllTests() {
  await testAuthentication();
  await testNegativeScenario();
}

runAllTests();
