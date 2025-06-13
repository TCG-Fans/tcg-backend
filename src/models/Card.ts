import mongoose, { Document, Schema } from 'mongoose';

// Interface for card
export interface ICard extends Document {
  cardId: number;
  setId: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: string; // unit/spell
  power: number;
  cost: number;
  faction: string;
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
      type: Number,
      required: true,
      unique: true,
    },
    setId: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    rarity: {
      type: String,
      required: true,
      enum: ['common', 'rare', 'mythic'],
    },
    type: {
      type: String,
      required: true,
      enum: ['unit', 'spell'],
    },
    power: {
      type: Number,
      required: false,
    },
    cost: {
      type: Number,
      required: false,
    },
    faction: {
      type: String,
      required: false,
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
