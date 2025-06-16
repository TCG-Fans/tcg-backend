import express from 'express';
import cors from 'cors';
import path from 'path';
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
    "default-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdnjs.cloudflare.com https://unpkg.com *; style-src 'self' 'unsafe-inline' *; connect-src 'self' ws: wss: *; img-src 'self' data: *; font-src 'self' *;"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статический файл-сервер для тестовых файлов
const testFilesPath = path.join(__dirname, '..');
app.use('/test', express.static(testFilesPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Специальный маршрут для основного тестового файла
app.get('/test-matchmaking', (req, res) => {
  res.sendFile(path.join(testFilesPath, 'test-matchmaking-multi-wallet.html'));
});

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
