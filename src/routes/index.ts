import { Router, Request, Response } from 'express';
import cardRoutes from './cardRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Mount health routes for API
// These will be accessible at /api/health
router.get('/health', (req, res) => {
  console.log('API health check request received at:', new Date().toISOString());
  const response = {
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  res.status(200).json(response);
  console.log('API health response sent:', response);
});

// Mount auth routes on /auth
// Now they will be accessible at /api/auth/...
router.use('/auth', authRoutes);

// Mount card routes on /cards
// Now they will be accessible at /api/cards/...
router.use('/cards', cardRoutes);

export default router;
