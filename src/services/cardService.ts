import Card, { ICard } from '../models/Card';
import User, { IUser, IUserCard } from '../models/User';


class CardService {
  // Get all cards from the catalog
  async getAllCards(): Promise<ICard[]> {
      return await Card.find();
  }

  // Get card by ID
  async getCardById(cardId: string): Promise<ICard | null> {
    return await Card.findOne({ cardId });
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

  // Handle token transfer event
  async handleTransferEvent(from: string, to: string, tokenId: string, cardId: string): Promise<void> {
    try {
      // Normalize addresses
      const normalizedTo = to.toLowerCase();
      
      // If this is a new card (mint) or transfer to a new user
      if (from === '0x0000000000000000000000000000000000000000' || from.toLowerCase() !== normalizedTo) {
        // Find the user or create if not exists
        const user = await User.findOne({ walletAddress: normalizedTo });
        
        if (user) {
          // Add the card to user's cards array
          user.cards.push({
            cardId,
            tokenId,
            acquiredAt: new Date(),
            transactionHash: 'transaction_hash' // In a real project, this would be the actual transaction hash
          });
          
          await user.save();
        }
      }
      
      // If this is a transfer from one user to another
      if (from !== '0x0000000000000000000000000000000000000000') {
        const normalizedFrom = from.toLowerCase();
        
        // Remove card from previous owner
        await User.updateOne(
          { walletAddress: normalizedFrom },
          { $pull: { cards: { tokenId } } }
        );
      }
    } catch (error) {
      console.error(`Error handling transfer event for token ${tokenId}:`, error);
      throw error;
    }
  }
}

export default new CardService();
