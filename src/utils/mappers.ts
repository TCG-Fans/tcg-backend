import { ICard } from '../models/Card';
import { IUserCard } from '../models/User';
import { IDeck, IDeckCard } from '../models/Deck';
import { CardDto, ExtendedUserCardDto, UserCardDto } from '../dtos/cardDtos';
import { DeckDto, ExtendedDeckDto, DeckCardDto, ExtendedDeckCardDto } from '../dtos/deckDtos';

/**
 * Maps a database Card model to a CardDto
 */
export function mapCardToDto(card: ICard): CardDto {
  return {
    id: card.cardId,
    name: card.name || '',
    description: card.description || '',
    imageUrl: card.imageUrl || '',
    rarity: card.rarity || '',
    type: card.type || 'unit',
    power: card.power || 0,
    cost: card.cost || 0,
    faction: card.faction || '',
    attributes: card.attributes || {}
  };
}

/**
 * Maps a database UserCard model to a UserCardDto
 */
export function mapUserCardToDto(userCard: IUserCard): UserCardDto {
  return {
    id: userCard.cardId,
    quantity: userCard.quantity || 0
  };
}

/**
 * Maps a combined card and userCard to a combined object
 */
export function mapUserCardWithDetails(
  data: { card: ICard; userCard: IUserCard }
): ExtendedUserCardDto {
  return {
    id: data.card.cardId,
    name: data.card.name || '',
    description: data.card.description || '',
    imageUrl: data.card.imageUrl || '',
    rarity: data.card.rarity || '',
    type: data.card.type || 'unit',
    power: data.card.power || 0,
    cost: data.card.cost || 0,
    faction: data.card.faction || '',
    quantity: data.userCard.quantity || 0
  };
}

/**
 * Maps a database DeckCard model to a DeckCardDto
 */
export function mapDeckCardToDto(deckCard: IDeckCard): DeckCardDto {
  return {
    id: deckCard.cardId,
    quantity: deckCard.quantity || 0
  };
}

/**
 * Maps a database Deck model to a DeckDto
 */
export function mapDeckToDto(deck: IDeck): DeckDto {
  return {
    id: (deck._id as any).toString(),
    name: deck.name || 'My Deck',
    cards: deck.cards.map(card => mapDeckCardToDto(card)),
    isActive: deck.isActive || false,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt
  };
}

/**
 * Maps a combined deck and card data to an extended deck DTO
 */
export function mapDeckToExtendedDto(
  deck: IDeck,
  cardsWithDetails: { card: ICard; deckCard: IDeckCard }[]
): ExtendedDeckDto {
  return {
    id: (deck._id as any).toString(),
    name: deck.name || 'My Deck',
    cards: cardsWithDetails.map(data => mapDeckCardWithDetails(data)),
    isActive: deck.isActive || false,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt
  };
}

/**
 * Maps a combined card and deckCard to an extended deck card DTO
 */
export function mapDeckCardWithDetails(
  data: { card: ICard; deckCard: IDeckCard }
): ExtendedDeckCardDto {
  return {
    id: data.card.cardId,
    name: data.card.name || '',
    description: data.card.description || '',
    imageUrl: data.card.imageUrl || '',
    rarity: data.card.rarity || '',
    type: data.card.type || 'unit',
    power: data.card.power || 0,
    cost: data.card.cost || 0,
    faction: data.card.faction || '',
    quantity: data.deckCard.quantity || 0,
    attributes: data.card.attributes || {}
  };
}
