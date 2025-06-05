import mongoose, { Document, Schema } from 'mongoose';

// Card interface for user's cards
export interface IUserCard {
  cardId: string;         // Reference to Card model
  tokenId: string;        // Blockchain token ID
  acquiredAt: Date;       // When the card was acquired
  transactionHash: string; // Transaction hash
}

// Interface for user
export interface IUser extends Document {
  walletAddress: string;  // User's wallet address
  nonce: string;          // Random nonce for authentication
  lastLogin: Date;        // Last login timestamp
  cards: IUserCard[];     // User's cards
  createdAt: Date;
  updatedAt: Date;
}

// Schema for user
const UserSchema: Schema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nonce: {
      type: String,
      required: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    cards: [{
      cardId: {
        type: String,
        required: true,
        ref: 'Card'
      },
      tokenId: {
        type: String,
        required: true
      },
      acquiredAt: {
        type: Date,
        default: Date.now
      },
      transactionHash: {
        type: String,
        required: true
      }
    }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IUser>('User', UserSchema);
