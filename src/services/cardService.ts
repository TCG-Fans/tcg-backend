import Card, { ICard } from '../models/Card';
import User, { IUser, IUserCard } from '../models/User';
import crypto from 'crypto';


class CardService {
  // Get all cards from the catalog
  async getAllCards(): Promise<ICard[]> {
      return Card.find();
  }

  // Get card by ID
  async getCardById(cardId: number): Promise<ICard | null> {
    return Card.findOne({cardId});
  }

  // Get user's cards
  async getUserCards(walletAddress: string): Promise<{card: ICard, userCard: IUserCard}[]> {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Find user with their cards
      const user = await User.findOne({ walletAddress: normalizedAddress }).lean();

      if (!user || !user.cards || user.cards.length === 0) {
        return [];
      }

      // Get all card IDs from user's cards
      const cardIds = user.cards.map(card => card.cardId);

      // Get all cards data
      const cards = await Card.find({ cardId: { $in: cardIds } }).lean();

      // Map user cards with their data
      const userCardsWithData = user.cards.map(userCard => {
        const cardData = cards.find(card => card.cardId === userCard.cardId) || null;
        return {
          card: cardData as ICard,
          userCard: userCard as IUserCard
        };
      }).filter(item => item.card !== null);

      return userCardsWithData;
    } catch (error) {
      console.error('Error fetching user cards:', error);
      return [];
    }
  }

  // Add card to user's collection
  async addCardToUser(walletAddress: string, cardId: number, quantity: number = 1, blockNumber: number = 0): Promise<void> {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Find the user or create a new one if doesn't exist
      let user = await User.findOne({ walletAddress: normalizedAddress });

      if (!user) {
        // Generate a random nonce for new user
        const nonce = crypto.randomBytes(32).toString('hex');

        user = await User.create({
          walletAddress: normalizedAddress,
          nonce,
          cards: []
        });
      }

      // Check if user already has this card
      const existingCardIndex = user.cards.findIndex(card => card.cardId === cardId);

      // Check if this is a duplicate transaction (same card and block number)
      if (existingCardIndex >= 0 && user.cards[existingCardIndex].lastBlockNumber === blockNumber && blockNumber !== 0) {
        console.log(`Duplicate transaction detected for card ${cardId} at block ${blockNumber}. Skipping.`);
        return;
      }

      if (existingCardIndex >= 0) {
        // User already has this card, update quantity and block number
        user.cards[existingCardIndex].quantity += quantity;
        user.cards[existingCardIndex].lastBlockNumber = blockNumber;
      } else {
        // Add new card to user's collection
        user.cards.push({
          cardId,
          quantity,
          lastBlockNumber: blockNumber
        });
      }

      await user.save();
    } catch (error) {
      console.error(`Error adding card ${cardId} to user ${walletAddress}:`, error);
      throw error;
    }
  }
}

export default new CardService();
