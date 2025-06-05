import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

// Route for getting authentication nonce
router.get('/nonce/:walletAddress', authController.getNonce.bind(authController));

// Route for verifying signature and authenticating
router.post('/verify', authController.verifySignature.bind(authController));

export default router;
