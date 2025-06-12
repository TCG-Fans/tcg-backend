import dotenv from 'dotenv';
import app from './app';
import blockchainService from './services/blockchainService';

// Load environment variables
dotenv.config();

// Define port
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start blockchain monitoring after server is started
  startBlockchainMonitoring();
});

/**
 * Start blockchain monitoring
 */
async function startBlockchainMonitoring(): Promise<void> {
  try {
    console.log('Starting blockchain monitoring...');
    await blockchainService.startMonitoring();
    console.log('Blockchain monitoring started successfully');
  } catch (error) {
    console.error('Error starting blockchain monitoring:', error);
  }
}

// Handle server shutdown - stop blockchain monitoring
process.on('SIGINT', async () => {
  console.log('Stopping server and blockchain monitoring...');
  await blockchainService.stopMonitoring();
  server.close(() => {
    console.log('Server and blockchain monitoring stopped');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // blockchainService.stopMonitoring().then(() => {
  //   process.exit(1);
  // });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // blockchainService.stopMonitoring().then(() => {
  //   server.close(() => {
  //     process.exit(1);
  //   });
  // });
});

export default server;
