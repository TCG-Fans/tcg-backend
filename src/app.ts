import express from 'express';
import cors from 'cors';
import routes from './routes';
import baseRoutes from './routes/baseRoutes';
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

// Basic health routes - must be defined BEFORE middleware
app.use(baseRoutes);

// Middleware
app.use(cors());
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
