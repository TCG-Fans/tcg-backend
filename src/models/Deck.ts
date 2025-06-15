import mongoose, { Document, Schema } from 'mongoose';

// Interface for deck card
export interface IDeckCard {
  cardId: number;  // Reference to Card model
  quantity: number; // Quantity of cards in deck (max 2 per card)
}

// Interface for deck
export interface IDeck extends Document {
  walletAddress: string;  // Owner's wallet address
  name: string;           // Deck name
  cards: IDeckCard[];     // Cards in the deck
  isActive: boolean;      // Whether this is the active deck
  createdAt: Date;
  updatedAt: Date;
}

// Schema for deck
const DeckSchema: Schema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      default: 'My Deck'
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
        min: 1,
        max: 2,
        default: 1
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one active deck per user
DeckSchema.index({ walletAddress: 1, isActive: 1 }, { 
  unique: true, 
  partialFilterExpression: { isActive: true } 
});

// Ensure deck name is unique per user
DeckSchema.index({ walletAddress: 1, name: 1 }, { unique: true });

export default mongoose.model<IDeck>('Deck', DeckSchema);
