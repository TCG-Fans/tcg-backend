import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
      };
    }
  }
}

/**
 * Middleware to check if the user is authenticated
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Extract the token from the Bearer scheme
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Invalid authentication token format' });
      return;
    }
    
    // Verify the token
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    
    // Add the user to the request object
    req.user = {
      walletAddress: decoded.walletAddress
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if the user is the owner of the requested resource
 * Used for routes that require the user to be the owner of a wallet address
 */
export const isWalletOwner = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the wallet address from the request parameters
    const { walletAddress } = req.params;
    
    // Check if the user is authenticated
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Check if the authenticated user is the owner of the wallet
    if (req.user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(403).json({ error: 'Access denied: You are not the owner of this wallet' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Wallet owner check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};
