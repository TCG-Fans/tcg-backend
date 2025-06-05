# WalletConnect Authentication Integration Guide

This guide explains how to integrate WalletConnect authentication with the backend API.

## Authentication Flow

The authentication flow consists of the following steps:

1. **Request a Nonce**: Frontend requests a nonce from the backend
2. **Sign the Message**: User signs the message with their wallet
3. **Verify the Signature**: Backend verifies the signature and issues a JWT token
4. **Use the Token**: Frontend uses the token for authenticated requests

## API Endpoints

### 1. Get Authentication Nonce

```
GET /api/auth/nonce/:walletAddress
```

**Parameters:**
- `walletAddress`: Ethereum wallet address (0x format)

**Response:**
```json
{
  "nonce": "random_nonce_string",
  "message": "Sign this message to authenticate with the card game: random_nonce_string"
}
```

### 2. Verify Signature

```
POST /api/auth/verify
```

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "walletAddress": "0x..."
}
```

## Frontend Integration Example

Here's a simple example of how to integrate with WalletConnect on the frontend:

```typescript
import { Web3Modal } from '@web3modal/standalone';
import { SignClient } from '@walletconnect/sign-client';

// Initialize WalletConnect
const signClient = await SignClient.init({
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'Card Game',
    description: 'Blockchain Card Game',
    url: 'https://yourgame.com',
    icons: ['https://yourgame.com/icon.png']
  }
});

// Connect to wallet
async function connectWallet() {
  try {
    const web3Modal = new Web3Modal({
      projectId: 'YOUR_PROJECT_ID',
      standaloneChains: ['eip155:1']
    });
    
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: ['eth_sign'],
          chains: ['eip155:1'],
          events: []
        }
      }
    });
    
    if (uri) {
      web3Modal.openModal({ uri });
      const session = await approval();
      web3Modal.closeModal();
      
      // Get the connected wallet address
      const walletAddress = session.namespaces.eip155.accounts[0].split(':')[2];
      
      return walletAddress;
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
  }
}

// Authenticate with backend
async function authenticate(walletAddress) {
  try {
    // Step 1: Get nonce
    const nonceResponse = await fetch(`/api/auth/nonce/${walletAddress}`);
    const { nonce, message } = await nonceResponse.json();
    
    // Step 2: Sign message
    const signature = await signClient.request({
      topic: signClient.session.topic,
      request: {
        method: 'eth_sign',
        params: [walletAddress, message]
      },
      chainId: 'eip155:1'
    });
    
    // Step 3: Verify signature
    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        signature
      })
    });
    
    const { token } = await verifyResponse.json();
    
    // Store token in localStorage
    localStorage.setItem('authToken', token);
    
    return token;
  } catch (error) {
    console.error('Authentication error:', error);
  }
}

// Make authenticated API calls
async function getUserCards(walletAddress) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('Not authenticated');
    return;
  }
  
  try {
    const response = await fetch(`/api/cards/user/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user cards:', error);
  }
}
```

## Security Considerations

1. Always use HTTPS in production
2. Store JWT tokens securely (localStorage is used in the example for simplicity)
3. Implement token refresh mechanism for long-lived sessions
4. Consider adding rate limiting to authentication endpoints
5. Monitor for suspicious authentication attempts

## Testing

You can test the authentication flow using tools like Postman or curl:

```bash
# Get nonce
curl -X GET "http://localhost:3000/api/auth/nonce/0x123..."

# Verify signature (after signing with wallet)
curl -X POST "http://localhost:3000/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x123...","signature":"0x456..."}'
```
