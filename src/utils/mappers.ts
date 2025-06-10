import { ICard } from '../models/Card';
import { IUserCard } from '../models/User';
import { CardDto, ExtendedUserCardDto, UserCardDto } from '../dtos/cardDtos';

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
    quantity: data.userCard.quantity || 0
  };
}
