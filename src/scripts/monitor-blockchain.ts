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
 * Start blockchain monitoring
 */
async function startMonitoring(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start monitoring
    await blockchainService.startMonitoring();
    
    console.log('Blockchain monitoring started');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Stopping blockchain monitoring...');
      await blockchainService.stopMonitoring();
      await mongoose.disconnect();
      console.log('Blockchain monitoring stopped');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting blockchain monitoring:', error);
    process.exit(1);
  }
}

// Run the monitoring
startMonitoring();
