import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ethers } from 'ethers';

// Get JWT secret from environment variables or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Define the JWT payload type
interface JwtPayload {
  walletAddress: string;
}

class AuthService {
  /**
   * Get or create a user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string): Promise<IUser> {
    // Normalize the wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Find existing user or create a new one
    let user = await User.findOne({ walletAddress: normalizedAddress });
    
    if (!user) {
      // Generate a random nonce for new user
      const nonce = this.generateNonce();
      
      user = await User.create({
        walletAddress: normalizedAddress,
        nonce
      });
    }
    
    return user;
  }
  
  /**
   * Generate a new random nonce for authentication
   */
  generateNonce(): string {
    // Generate a random string for the nonce
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Refresh the nonce for a user
   */
  async refreshNonce(walletAddress: string): Promise<string> {
    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = this.generateNonce();
    
    await User.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      { nonce },
      { new: true }
    );
    
    return nonce;
  }
  
  /**
   * Verify a signature from WalletConnect
   */
  verifySignature(message: string, signature: string, walletAddress: string): boolean {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare with the provided wallet address
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }
  
  /**
   * Generate a JWT token for authenticated user
   */
  generateToken(walletAddress: string): string {
    // Create the payload
    const payload = { walletAddress: walletAddress.toLowerCase() };
    
    // Sign with the secret key
    return jwt.sign(payload, JWT_SECRET);
  }
  
  /**
   * Verify a JWT token
   */
  verifyToken(token: string): { walletAddress: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return { walletAddress: decoded.walletAddress };
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
  
  /**
   * Update the last login timestamp for a user
   */
  async updateLastLogin(walletAddress: string): Promise<void> {
    const normalizedAddress = walletAddress.toLowerCase();
    
    await User.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      { lastLogin: new Date() }
    );
  }
}

export default new AuthService();
