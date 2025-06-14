import express from 'express';
import cors from 'cors';
import routes from './routes';
import { connectDB } from './config/database';

// Create Express application
const app = express();

// Log incoming requests
app.use((req, res, next) => {
  console.log(`→ Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to database
connectDB();

// CORS configuration for localhost development accessing EC2 server
const corsOptions = {
  origin: [
    // Local development origins (accessing EC2 server)
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:80',
    // EC2 server itself (for internal requests)
    'http://ec2-3-83-215-13.compute-1.amazonaws.com',
    'http://ec2-3-83-215-13.compute-1.amazonaws.com:80'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));

// Content Security Policy for cross-origin requests
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "connect-src 'self' http://localhost:* http://127.0.0.1:* http://ec2-3-83-215-13.compute-1.amazonaws.com"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API маршруты
app.use('/api', routes);

// Handle 404 for non-existent routes
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

export default app;
