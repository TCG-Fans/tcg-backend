import { Request, Response } from 'express';
import authService from '../services/authService';

class AuthController {
  /**
   * Get a nonce for authentication
   * This is the first step in the WalletConnect authentication flow
   */
  async getNonce(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      
      if (!this.isValidWalletAddress(walletAddress)) {
        res.status(400).json({ error: 'Invalid wallet address format' });
        return;
      }
      
      // Get or create user and return their nonce
      const user = await authService.getUserByWalletAddress(walletAddress);
      
      res.json({ 
        nonce: user.nonce,
        message: `Sign this message to authenticate with the card game: ${user.nonce}`
      });
    } catch (error) {
      console.error('Error getting nonce:', error);
      res.status(500).json({ error: 'Failed to get authentication nonce' });
    }
  }
  
  /**
   * Verify signature and authenticate user
   * This is the second step in the WalletConnect authentication flow
   */
  async verifySignature(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature } = req.body;
      
      if (!walletAddress || !signature) {
        res.status(400).json({ error: 'Wallet address and signature are required' });
        return;
      }
      
      if (!this.isValidWalletAddress(walletAddress)) {
        res.status(400).json({ error: 'Invalid wallet address format' });
        return;
      }
      
      // Get the user to verify their nonce
      const user = await authService.getUserByWalletAddress(walletAddress);
      
      // Create the message that was signed
      const message = `Sign this message to authenticate with the card game: ${user.nonce}`;
      
      // Verify the signature
      const isValid = authService.verifySignature(message, signature, walletAddress);
      
      if (!isValid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
      
      // Generate a new nonce for next time
      await authService.refreshNonce(walletAddress);
      
      // Update last login time
      await authService.updateLastLogin(walletAddress);
      
      // Generate JWT token
      const token = authService.generateToken(walletAddress);
      
      // Return the token
      res.json({ 
        token,
        walletAddress: walletAddress.toLowerCase()
      });
    } catch (error) {
      console.error('Error verifying signature:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
  
  /**
   * Validate a wallet address format
   */
  private isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default new AuthController();
