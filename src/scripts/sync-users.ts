import mongoose from 'mongoose';
import dotenv from 'dotenv';
import blockchainService from '../services/blockchainService';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/card-game';

/**
 * Connect to MongoDB
 */
async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Sync all users with blockchain
 */
async function syncUsers(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Sync all users
    await blockchainService.syncAllUsers();
    
    console.log('All users synced with blockchain');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing users with blockchain:', error);
    process.exit(1);
  }
}

// Run the sync
syncUsers();
