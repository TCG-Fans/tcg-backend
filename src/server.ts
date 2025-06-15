import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import blockchainService from './services/blockchainService';
import productionDataService from './services/productionDataService';
import websocketService from './services/websocketService';

// Load environment variables
dotenv.config();

// Define port
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket service
websocketService.initialize(httpServer);

// Start the server
const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready on port ${PORT}`);
  
  // Initialize production data and start blockchain monitoring after server is started
  initializeServices();
});

/**
 * Initialize all services
 */
async function initializeServices(): Promise<void> {
  try {
    // Initialize production card data
    console.log('Initializing production card data...');
    await productionDataService.seedProductionCardsInitialSet();
    console.log('Production card data initialized successfully');
    
    // Start blockchain monitoring
    console.log('Starting blockchain monitoring...');
    await blockchainService.startMonitoring();
    console.log('Blockchain monitoring started successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Handle server shutdown - stop blockchain monitoring
process.on('SIGINT', async () => {
  console.log('Stopping server, WebSocket service, and blockchain monitoring...');
  await blockchainService.stopMonitoring();
  server.close(() => {
    console.log('Server, WebSocket service, and blockchain monitoring stopped');
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
