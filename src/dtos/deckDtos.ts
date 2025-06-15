/**
 * Data Transfer Objects for Deck-related API responses
 */

// DTO for deck card information
export interface DeckCardDto {
  id: number;
  quantity: number;
}

// DTO for basic deck information
export interface DeckDto {
  id: string;
  name: string;
  cards: DeckCardDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended DTO for deck with full card details
export interface ExtendedDeckDto {
  id: string;
  name: string;
  cards: ExtendedDeckCardDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended DTO for deck card with full card information
export interface ExtendedDeckCardDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: string; // unit/spell
  power: number;
  cost: number;
  faction: string;
  quantity: number;
  attributes: Record<string, any>;
}

// DTO for adding/removing cards from deck
export interface DeckCardActionDto {
  cardId: number;
  quantity?: number; // Optional for add operation, defaults to 1
}

// DTO for deck creation/update
export interface CreateDeckDto {
  name?: string;
  cards?: DeckCardDto[];
}

// DTO for deck operation responses
export interface DeckOperationResponseDto {
  success: boolean;
  message: string;
  deck?: DeckDto;
}
