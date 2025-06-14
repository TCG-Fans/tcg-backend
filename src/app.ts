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

// CORS configuration - allow all for development
const corsOptions = {
  origin: true, // Allow all origins for development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));

// Content Security Policy - allow all for development
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "connect-src *; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
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
