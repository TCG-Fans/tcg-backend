# TCG Fans API Documentation

This document provides comprehensive information about the TCG Fans API endpoints, request formats, and response structures.

## Table of Contents

1. [Base Routes](#base-routes)
2. [Authentication Routes](#authentication-routes)
3. [Card Routes](#card-routes)
4. [Deck Routes](#deck-routes)
5. [Matchmaking Routes](#matchmaking-routes)

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
    }
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
    }
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
    }
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

## Deck Routes

Deck routes provide access to user deck management functionality. All deck endpoints require authentication.

### Get User Deck

Retrieve the authenticated user's current deck with full card details.

- **URL**: `/api/deck`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "data": {
    "deck": {
      "deckId": "507f1f77bcf86cd799439011",
      "walletAddress": "0x14791697260E4c9A71f18484C9f997B308e59325",
      "cards": [
        {
          "cardId": 1,
          "name": "Fire Dragon",
          "description": "A powerful fire-breathing dragon",
          "imageUrl": "https://example.com/cards/fire-dragon.jpg",
          "rarity": "mythic",
          "attack": 8,
          "defense": 6,
          "cost": 7,
          "quantity": 2
        }
      ],
      "totalCards": 2,
      "uniqueCards": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:45:00.000Z"
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Deck not found
- **500 Internal Server Error**: Server error

### Add Card to Deck

Add a card to the user's deck with specified quantity.

- **URL**: `/api/deck/:cardId`
- **Method**: `PUT`
- **Authentication**: Required (JWT token in Authorization header)
- **Content-Type**: `application/json`
- **URL Parameters**: 
  - `cardId`: Numeric ID of the card to add

**Request Body**:
```json
{
  "quantity": 2
}
```

**Validation Rules**:
- `quantity`: Must be between 1 and 2
- Maximum 2 cards of the same type allowed per deck
- User must own the card in their collection
- Cannot add more cards than owned

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "message": "Card added to deck successfully",
  "data": {
    "deckId": "507f1f77bcf86cd799439011",
    "walletAddress": "0x14791697260E4c9A71f18484C9f997B308e59325",
    "cards": [
      {
        "cardId": 1,
        "quantity": 2
      }
    ],
    "totalCards": 2,
    "uniqueCards": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input (quantity out of range, invalid card ID, etc.)
  ```json
  {
    "success": false,
    "error": "Quantity must be between 1 and 2"
  }
  ```
- **400 Bad Request**: Business logic errors
  ```json
  {
    "success": false,
    "error": "Maximum 2 cards of the same type allowed in deck"
  }
  ```
  ```json
  {
    "success": false,
    "error": "User does not own this card"
  }
  ```
  ```json
  {
    "success": false,
    "error": "Not enough cards in collection"
  }
  ```
- **401 Unauthorized**: User not authenticated
- **500 Internal Server Error**: Server error

### Remove Card from Deck

Remove a specific quantity of cards from the user's deck.

- **URL**: `/api/deck/:cardId`
- **Method**: `DELETE`
- **Authentication**: Required (JWT token in Authorization header)
- **Content-Type**: `application/json`
- **URL Parameters**: 
  - `cardId`: Numeric ID of the card to remove

**Request Body** (Optional):
```json
{
  "quantity": 1
}
```

**Notes**:
- If `quantity` is not specified, removes all cards of that type
- If `quantity` is specified, removes only that amount

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "message": "Card removed from deck successfully",
  "data": {
    "deckId": "507f1f77bcf86cd799439011",
    "walletAddress": "0x14791697260E4c9A71f18484C9f997B308e59325",
    "cards": [],
    "totalCards": 0,
    "uniqueCards": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid card ID
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Card not found in deck
- **500 Internal Server Error**: Server error

### Clear Deck

Remove all cards from the user's deck.

- **URL**: `/api/deck`
- **Method**: `DELETE`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "message": "Deck cleared successfully",
  "data": {
    "deckId": "507f1f77bcf86cd799439011",
    "walletAddress": "0x14791697260E4c9A71f18484C9f997B308e59325",
    "cards": [],
    "totalCards": 0,
    "uniqueCards": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: User not authenticated
- **500 Internal Server Error**: Server error

## Matchmaking Routes

Matchmaking routes handle player queue management, match creation, and match lifecycle. All matchmaking endpoints require authentication and an active WebSocket connection.

### Join Matchmaking Queue

Add the authenticated player to the matchmaking queue to find opponents.

- **URL**: `/api/matchmaking/join`
- **Method**: `POST`
- **Authentication**: Required (JWT token in Authorization header)
- **Prerequisites**: Active WebSocket connection required

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "message": "Joined matchmaking queue"
}
```

**Error Response Bodies**:
```json
{
  "success": false,
  "error": "WebSocket connection required for matchmaking"
}
```
```json
{
  "success": false,
  "error": "Player already in queue"
}
```
```json
{
  "success": false,
  "error": "Player already has an active match"
}
```

**WebSocket Events Emitted**:
- `queueJoined`: Sent to the player with queue position and size
- `matchFound`: Sent to both players when a match is created

### Leave Queue or Cancel Match

Remove the player from the matchmaking queue or cancel an active match.

- **URL**: `/api/matchmaking/leave`
- **Method**: `DELETE`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Bodies**:
```json
{
  "success": true,
  "message": "Left matchmaking queue"
}
```
```json
{
  "success": true,
  "message": "Match cancelled"
}
```

**Error Response Body**:
```json
{
  "success": false,
  "error": "Not in queue and no pending match found"
}
```

**WebSocket Events Emitted**:
- `queueLeft`: Sent to the player when leaving queue
- `matchCancelled`: Sent to both players when match is cancelled

### Confirm Match

Confirm participation in a found match. Both players must confirm within the time limit.

- **URL**: `/api/matchmaking/start`
- **Method**: `POST`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "message": "Match confirmed"
}
```

**Error Response Bodies**:
```json
{
  "success": false,
  "error": "No pending match found"
}
```
```json
{
  "success": false,
  "error": "Match confirmation timeout"
}
```

**WebSocket Events Emitted**:
- `matchConfirmed`: Sent to the confirming player
- `matchStarted`: Sent to both players when both have confirmed
- `matchCancelled`: Sent to both players if confirmation times out

### Get Player Status

Retrieve the current matchmaking status for the authenticated player.

- **URL**: `/api/matchmaking/status`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "data": {
    "inQueue": true,
    "queuePosition": 2,
    "queueSize": 5,
    "activeMatch": null
  }
}
```

**Response with Active Match**:
```json
{
  "success": true,
  "data": {
    "inQueue": false,
    "queuePosition": null,
    "queueSize": 3,
    "activeMatch": {
      "matchId": "match_987654321",
      "status": "found",
      "opponent": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "playerStatus": "waiting",
      "createdAt": "2024-01-15T15:00:00.000Z"
    }
  }
}
```

### Get Match Details

Retrieve detailed information about a specific match.

- **URL**: `/api/matchmaking/:matchId`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)
- **URL Parameters**: 
  - `matchId`: Unique identifier of the match

**Response**:
- **Status Code**: 200 OK
- **Content**: JSON object

**Success Response Body**:
```json
{
  "success": true,
  "data": {
    "matchId": "match_123456789",
    "status": "completed",
    "opponent": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "playerStatus": "confirmed",
    "createdAt": "2024-01-15T14:00:00.000Z",
    "startedAt": "2024-01-15T14:01:00.000Z",
    "completedAt": "2024-01-15T14:30:00.000Z",
    "result": "WIN",
    "winner": "0x14791697260E4c9A71f18484C9f997B308e59325"
  }
}
```

**Error Response Bodies**:
```json
{
  "success": false,
  "error": "Match not found"
}
```
```json
{
  "success": false,
  "error": "Access denied"
}
```

## Match Status Values

- **found**: Match created, waiting for player confirmations
- **confirmed**: Both players confirmed, match is ready to start
- **in_progress**: Match is currently active and being played
- **completed**: Match finished with a result
- **cancelled**: Match cancelled due to timeout or player action

## Player Status Values

- **waiting**: Player has not yet confirmed the match
- **confirmed**: Player has confirmed participation
- **disconnected**: Player lost connection during match

## WebSocket Events

Matchmaking relies heavily on WebSocket events for real-time communication:

### Client → Server Events
- `authenticate`: Authenticate WebSocket connection with JWT token

### Server → Client Events
- `queueJoined`: Player successfully joined the queue
- `queueLeft`: Player left the queue
- `matchFound`: Match found, waiting for confirmation
- `matchConfirmed`: Player confirmed the match
- `matchStarted`: Both players confirmed, match begins
- `matchCancelled`: Match cancelled or timed out
- `opponentReconnected`: Opponent reconnected to an active match

**Example WebSocket Event Data**:
```json
{
  "event": "matchFound",
  "data": {
    "matchId": "match_123456789",
    "opponent": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "confirmationTimeLimit": 30000
  }
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
