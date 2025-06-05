import { Router, Request, Response } from 'express';

const router = Router();

// Basic ping route
router.get('/ping', (req: Request, res: Response) => {
  console.log('Ping request received at:', new Date().toISOString());
  res.status(200).send('pong');
  console.log('Ping response sent');
});

// Health check route
router.get('/health', (req: Request, res: Response) => {
  console.log('Health check request received at:', new Date().toISOString());
  const response = {
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
  console.log('Health response sent:', response);
});

export default router;
