import mongoose, { Document, Schema } from 'mongoose';

// Card interface for user's cards
export interface IUserCard {
  cardId: number;  // Reference to Card model
  quantity: number; // Quantity of cards owned
  lastBlockNumber: number; // Last block number when this card was added/updated
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
        type: Number,
        required: true,
        ref: 'Card'
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      lastBlockNumber: {
        type: Number,
        required: true,
        default: 0
      }
    }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IUser>('User', UserSchema);
