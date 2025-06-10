# TCG Fans API Documentation

This document provides comprehensive information about the TCG Fans API endpoints, request formats, and response structures.

## Table of Contents

1. [Base Routes](#base-routes)
2. [Authentication Routes](#authentication-routes)
3. [Card Routes](#card-routes)

## Base Routes

Base routes provide basic system information and health checks.

### Ping Endpoint

Check if the API is responsive.

- **URL**: `/api/ping`
- **Method**: `GET`
- **Authentication**: None

**Response**:
- **Status Code**: 200 OK
- **Content**: `pong` (text/plain)

**Example**:
```
GET /api/ping
```

```
pong
```

### Health Check Endpoint

Get detailed information about the API health status.

- **URL**: `/api/health`
- **Method**: `GET`
- **Authentication**: None

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Response Body**:
```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "2025-06-10T19:52:13.000Z"
}
```

## Authentication Routes

Authentication routes handle wallet-based authentication using blockchain signatures.

### Get Authentication Nonce

Retrieve a nonce for wallet signature authentication.

- **URL**: `/api/auth/nonce/:walletAddress`
- **Method**: `GET`
- **Authentication**: None
- **URL Parameters**: 
  - `walletAddress`: Ethereum wallet address (0x format)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Response Body**:
```json
{
  "success": true,
  "nonce": "a1b2c3d4e5f6..."
}
```

### Verify Signature

Authenticate a user by verifying their wallet signature.

- **URL**: `/api/auth/verify`
- **Method**: `POST`
- **Authentication**: None
- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "walletAddress": "0x123...",
  "signature": "0xabcdef..."
}
```

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "walletAddress": "0x123..."
  }
}
```

**Error Response Body**:
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

## Card Routes

Card routes provide access to the card catalog and user card collections.

### Get All Cards

Retrieve the complete card catalog.

- **URL**: `/api/cards`
- **Method**: `GET`
- **Authentication**: None

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Response Body**:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "Fire Dragon",
      "description": "A powerful fire-breathing dragon",
      "imageUrl": "https://example.com/cards/fire-dragon.jpg",
      "rarity": "mythic",
      "attributes": {
        "attack": 8,
        "defense": 6,
        "mana": 7,
        "element": "fire"
      }
    },
    // More cards...
  ]
}
```

### Get Card by ID

Retrieve a specific card by its ID.

- **URL**: `/api/cards/:cardId`
- **Method**: `GET`
- **Authentication**: None
- **URL Parameters**: 
  - `cardId`: Numeric ID of the card

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Fire Dragon",
    "description": "A powerful fire-breathing dragon",
    "imageUrl": "https://example.com/cards/fire-dragon.jpg",
    "rarity": "mythic",
    "attributes": {
      "attack": 8,
      "defense": 6,
      "mana": 7,
      "element": "fire"
    }
  }
}
```

**Error Response Body** (Card not found):
```json
{
  "success": false,
  "error": "Card not found"
}
```

### Get My Cards

Retrieve the authenticated user's card collection.

- **URL**: `/api/cards/my`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Fire Dragon",
      "description": "A powerful fire-breathing dragon",
      "imageUrl": "https://example.com/cards/fire-dragon.jpg",
      "rarity": "mythic",
      "quantity": 2
    },
    // More cards...
  ]
}
```

**Error Response Body** (Unauthorized):
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Get Cards by Wallet Address

Retrieve cards owned by a specific wallet address.

- **URL**: `/api/cards/wallet/:walletAddress`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)
- **URL Parameters**: 
  - `walletAddress`: Ethereum wallet address (0x format)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Fire Dragon",
      "description": "A powerful fire-breathing dragon",
      "imageUrl": "https://example.com/cards/fire-dragon.jpg",
      "rarity": "mythic",
      "quantity": 2
    },
    // More cards...
  ]
}
```

**Error Response Body** (Invalid wallet address):
```json
{
  "success": false,
  "error": "Invalid wallet address format"
}
```

## Authentication

Most protected endpoints require authentication via JWT token.

**Authentication Header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Resource not found
- `500 Server Error`: Internal server error
