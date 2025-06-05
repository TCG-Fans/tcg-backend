# Backend for Collectible Card Game

Backend service for a collectible card game that provides integration with the Avalanche blockchain for managing user cards.

## Technologies

- TypeScript
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Web3.js for interacting with the Avalanche blockchain
- Docker and Docker Compose for containerization

## Features

- Storage and management of card catalog
- Tracking card ownership through the Avalanche blockchain
- API for retrieving user's card collection
- JWT-based authentication with wallet signatures
- Secure endpoints for user data

## Installation and Setup

### Prerequisites

- Node.js (version 18+)
- Docker and Docker Compose (for containerized setup)
- Access to an Avalanche node (public testnet nodes can be used)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in the required environment variables

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Build and Run in Production

```bash
npm run build
npm start
```

#### Using Docker

Run the full stack (backend and MongoDB):

```bash
docker-compose up
```

Run only MongoDB (for local development):

```bash
docker-compose up -d mongodb
```

## API Endpoints

### Authentication

```
GET /api/auth/nonce/:walletAddress  # Get nonce for authentication
POST /api/auth/verify               # Verify signature and get JWT token
```

### Cards

```
GET /api/cards                      # Get all cards
GET /api/cards/:cardId              # Get card by ID
GET /api/cards/my/cards             # Get authenticated user's cards (requires JWT)
```

### Health Checks

```
GET /health                         # Health check endpoint
GET /ping                           # Simple ping endpoint
```

## Blockchain Integration

The application listens for token transfer events on the Avalanche blockchain and updates the database when new events are received. Web3.js is used for blockchain interaction.

Key blockchain features:

- Listening for Transfer events from the NFT contract
- Updating user card ownership based on blockchain events
- Wallet-based authentication using message signing
- Secure verification of wallet ownership

## Development

### Scripts

- `npm run dev` - run in development mode with automatic reload
- `npm run build` - build the project
- `npm start` - run the built project
- `npm test` - run tests
- `npm run lint` - check code with linter
- `npm run test:auth` - run authentication tests
- `npm run test:auth:auto` - run automated authentication tests

### Data Model

The application uses an embedded document pattern for user cards, storing card data directly within the User model for improved query efficiency.
