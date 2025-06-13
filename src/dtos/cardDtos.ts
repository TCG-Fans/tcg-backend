/**
 * Data Transfer Objects for Card-related API responses
 */

// DTO for basic card information
export interface CardDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: string; // unit/spell
  power: number;
  cost: number;
  faction: string;
  attributes: Record<string, any>;
}

// DTO for user's card information
export interface UserCardDto {
  id: number;
  quantity: number;
}

// Extended DTO for user's card information
export interface ExtendedUserCardDto {
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
}