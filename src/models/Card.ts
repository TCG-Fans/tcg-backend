import mongoose, { Document, Schema } from 'mongoose';

// Interface for card
export interface ICard extends Document {
  cardId: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: string;
  attributes: {
    [key: string]: number | string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema for card
const CardSchema: Schema = new Schema(
  {
    cardId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    },
    type: {
      type: String,
      required: true,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICard>('Card', CardSchema);
