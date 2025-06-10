import mongoose from 'mongoose';
import Card from '../models/Card';
import User from '../models/User';
import crypto from 'crypto';
import { ethers } from 'ethers';

/**
 * Service for seeding test data into the database
 */
class SeedService {
  /**
   * Seed card catalog with test data
   */
  async seedCards(): Promise<void> {
    try {
      // Check if cards already exist
      const cardCount = await Card.countDocuments();
      if (cardCount > 0) {
        console.log(`Database already has ${cardCount} cards. Skipping seed.`);
        return;
      }

      console.log('Seeding card catalog...');

      // Sample card data
      const cards = [
        {
          cardId: 1, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Fire Dragon',
          description: 'A powerful dragon that breathes fire',
          imageUrl: 'https://placekitten.com/200/300', // Placeholder image
          rarity: 'mythic',
          attributes: {
            attack: 8,
            defense: 6,
            mana: 7,
            element: 'fire'
          }
        },
        {
          cardId: 2, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Water Elemental',
          description: 'A fluid being made of pure water',
          imageUrl: 'https://placekitten.com/201/300', // Placeholder image
          rarity: 'rare',
          attributes: {
            attack: 4,
            defense: 6,
            mana: 4,
            element: 'water'
          }
        },
        {
          cardId: 3, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Earth Golem',
          description: 'A massive creature made of stone and earth',
          imageUrl: 'https://placekitten.com/202/300', // Placeholder image
          rarity: 'common',
          attributes: {
            attack: 3,
            defense: 9,
            mana: 5,
            element: 'earth'
          }
        },
        {
          cardId: 4, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Wind Sprite',
          description: 'A fast and elusive air spirit',
          imageUrl: 'https://placekitten.com/203/300', // Placeholder image
          rarity: 'common',
          attributes: {
            attack: 2,
            defense: 2,
            mana: 2,
            element: 'air',
            ability: 'flying'
          }
        },
        {
          cardId: 5, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Lightning Bolt',
          description: 'A powerful spell that deals direct damage',
          imageUrl: 'https://placekitten.com/204/300', // Placeholder image
          rarity: 'common',
          attributes: {
            damage: 6,
            mana: 3,
            element: 'lightning',
            type: 'spell'
          }
        },
        {
          cardId: 6, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Healing Potion',
          description: 'Restores health to a creature or player',
          imageUrl: 'https://placekitten.com/205/300', // Placeholder image
          rarity: 'common',
          attributes: {
            healing: 5,
            mana: 2,
            element: 'nature',
            type: 'item'
          }
        },
        {
          cardId: 7, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Shadow Assassin',
          description: 'A stealthy killer that strikes from the shadows',
          imageUrl: 'https://placekitten.com/206/300', // Placeholder image
          rarity: 'mythic',
          attributes: {
            attack: 7,
            defense: 3,
            mana: 5,
            element: 'shadow',
            ability: 'stealth'
          }
        },
        {
          cardId: 8, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Mana Crystal',
          description: 'A magical crystal that provides additional mana',
          imageUrl: 'https://placekitten.com/207/300', // Placeholder image
          rarity: 'rare',
          attributes: {
            manaBoost: 3,
            mana: 4,
            element: 'arcane',
            type: 'artifact'
          }
        },
        {
          cardId: 9, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Shield of Protection',
          description: 'A shield that blocks damage',
          imageUrl: 'https://placekitten.com/208/300', // Placeholder image
          rarity: 'common',
          attributes: {
            defense: 5,
            mana: 3,
            element: 'light',
            type: 'equipment'
          }
        },
        {
          cardId: 10, // Numeric cardId
          setId: 0, // setId set to 0
          name: 'Cursed Amulet',
          description: 'An ancient amulet that weakens enemies',
          imageUrl: 'https://placekitten.com/209/300', // Placeholder image
          rarity: 'mythic',
          attributes: {
            debuff: 4,
            mana: 5,
            element: 'dark',
            type: 'artifact'
          }
        }
      ];

      // Insert cards into database
      await Card.insertMany(cards);
      console.log(`Successfully seeded ${cards.length} cards`);
    } catch (error) {
      console.error('Error seeding cards:', error);
      throw error;
    }
  }

  /**
   * Seed test user with cards
   */
  async seedTestUser(): Promise<void> {
    try {
      const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
      const wallet = new ethers.Wallet(PRIVATE_KEY);
      const testWalletAddress = wallet.address.toLowerCase();

      console.log('Creating test user with wallet address:', testWalletAddress);

      // Check if test user already exists and remove if it does (for clean testing)
      const existingUser = await User.findOne({ walletAddress: testWalletAddress });
      if (existingUser) {
        console.log('Test user already exists. Do nothing.');
        return;
      }

      // Generate random nonce
      const nonce = crypto.randomBytes(32).toString('hex');

      // Create test user
      const testUser = new User({
        walletAddress: testWalletAddress,
        nonce,
        lastLogin: new Date(),
        cards: []
      });

      // Save user
      await testUser.save();
      console.log('Test user created successfully');

      // Get some cards to assign to the user
      const cards = await Card.find().limit(5);

      if (cards.length === 0) {
        console.log('No cards found in database. Make sure to run seedCards() first.');
        return;
      }

      // Assign cards to user
      const userCards = cards.map((card, index) => ({
        cardId: card.cardId, // Using cardId from the card document
        quantity: Math.floor(Math.random() * 5) + 1, // Random quantity between 1 and 5
        lastBlockNumber: Math.floor(Math.random() * 1000000) + 1 // Random block number for testing
      }));

      console.log('Cards to be assigned:', userCards);

      // Update user with cards - using direct update for consistency
      const updatedUser = await User.findOneAndUpdate(
        { walletAddress: testWalletAddress },
        { $push: { cards: { $each: userCards } } },
        { new: true }
      );

      if (!updatedUser) {
        console.error('Failed to update user with cards');
        return;
      }

      console.log(`Assigned ${userCards.length} cards to test user`);
      console.log('Updated user:', updatedUser.walletAddress);
      console.log('User now has', updatedUser.cards.length, 'cards');
    } catch (error) {
      console.error('Error seeding test user:', error);
      throw error;
    }
  }

  /**
   * Seed all test data
   */
  async seedAll(): Promise<void> {
    try {
      await this.seedCards();
      await this.seedTestUser();
      console.log('Database seeding completed successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Clear all test data
   */
  async clearAll(): Promise<void> {
    try {
      await Card.deleteMany({});
      await User.deleteMany({});
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
}

export default new SeedService();
