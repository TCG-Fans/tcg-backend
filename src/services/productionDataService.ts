import mongoose from 'mongoose';
import Card from '../models/Card';

/**
 * Service for seeding production card data into the database
 */
class ProductionDataService {
  /**
   * Seed production card catalog
   */
  async seedProductionCardsInitialSet(): Promise<void> {
    try {
      // Check if production cards already exist
      const cardCount = await Card.countDocuments({ setId: 1 });
      if (cardCount === 64) {
        console.log(`Database already has ${cardCount} production cards. Skipping seed.`);
        return;
      }

      console.log('Seeding production card catalog...');

      // Production card data - Gladiators
      const gladiatorCards = [
        {
          cardId: 65537,
          setId: 1,
          name: 'Razor Grunt',
          description: 'Overclock: +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 1,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65538,
          setId: 1,
          name: 'Back-Alley Brawler',
          description: 'If there is another gladiator in this lane, gain +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 2,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65539,
          setId: 1,
          name: 'Stim Junkie',
          description: 'On Play: Another Gladiator gains +1 Power this turn',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65540,
          setId: 1,
          name: 'Chrome Fist',
          description: 'Protocol: Can\'t be moved or returned to hand',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 4,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65541,
          setId: 1,
          name: 'Duelist',
          description: 'Overclock: +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 2,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65542,
          setId: 1,
          name: 'Gang Enforcer',
          description: 'If you control this lane, +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 3,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65543,
          setId: 1,
          name: 'Neon Pugilist',
          description: 'On Play: Draw a card if you control another Gladiator',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65544,
          setId: 1,
          name: 'Augmented Thug',
          description: '',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 5,
          cost: 4,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65545,
          setId: 1,
          name: 'Turbo Charger',
          description: 'On Play: Give a Gladiator +3 Power this turn',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 2,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65546,
          setId: 1,
          name: 'Riot Gear',
          description: 'Overclock: +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'gladiator',
          attributes: {}
        }
      ];

      // Insert gladiator cards
      await Card.insertMany(gladiatorCards);
      console.log(`Successfully seeded ${gladiatorCards.length} Gladiator cards`);

      // Gladiators - Rare cards
      const gladiatorRareCards = [
        {
          cardId: 65793,
          setId: 1,
          name: 'Razor Jill',
          description: 'Overclock: +3 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 4,
          cost: 3,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65794,
          setId: 1,
          name: 'Glowstick Bruiser',
          description: 'On Play: If you Overclocked this turn, draw 1',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 4,
          cost: 4,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65795,
          setId: 1,
          name: 'Neon Warchief',
          description: 'Protocol: Gladiators in this lane have +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 6,
          cost: 5,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 65796,
          setId: 1,
          name: 'Underground Kingpin',
          description: 'On Play: Summon a 1-Power Gladiator',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 4,
          cost: 4,
          faction: 'gladiator',
          attributes: {}
        }
      ];

      // Gladiators - Mythic cards
      const gladiatorMythicCards = [
        {
          cardId: 66049,
          setId: 1,
          name: 'Neon Overlord',
          description: 'On Play: Discard 2 or -4 Power. Protocol: Gladiators everywhere get +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'unit',
          power: 7,
          cost: 6,
          faction: 'gladiator',
          attributes: {}
        },
        {
          cardId: 66050,
          setId: 1,
          name: 'The Ripper',
          description: 'Overclock: +5 Power. If its Power bigger than target enemy\'s Power, reduce that unit Power to 0',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'unit',
          power: 5,
          cost: 5,
          faction: 'gladiator',
          attributes: {}
        }
      ];

      // Hackers - Common cards
      const hackerCommonCards = [
        {
          cardId: 65547,
          setId: 1,
          name: 'Script Kiddie',
          description: 'Glitch 1',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65548,
          setId: 1,
          name: 'Data Scrambler',
          description: 'On Play: Swap Power with another unit',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 2,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65549,
          setId: 1,
          name: 'Malware Injector',
          description: 'On Play: All enemy units in this lane get Glitch 2',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 3,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65550,
          setId: 1,
          name: 'Ghost Signal',
          description: 'On Play: Move another hacker to another lane',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 1,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65551,
          setId: 1,
          name: 'Encryptor',
          description: 'Protocol: Hackers can\'t be Silenced',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 2,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65552,
          setId: 1,
          name: 'Backdoor',
          description: 'On Play: Return a unit to hand',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 3,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65553,
          setId: 1,
          name: 'Spam Bot',
          description: '',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 1,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65554,
          setId: 1,
          name: 'Glitch Trap',
          description: 'Glitch 1. If glitched unit\'s power was already ≤0, draw 1',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 2,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65555,
          setId: 1,
          name: 'Static Burst',
          description: 'Glitch 1 on all enemies in a lane',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 2,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65556,
          setId: 1,
          name: 'Null Byte',
          description: 'On Play: Silence a unit with ≤1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'hacker',
          attributes: {}
        }
      ];

      // Insert all card arrays
      await Card.insertMany([
        ...gladiatorRareCards,
        ...gladiatorMythicCards,
        ...hackerCommonCards
      ]);

      console.log(`Successfully seeded additional ${gladiatorRareCards.length + gladiatorMythicCards.length + hackerCommonCards.length} cards`);

      // Hackers - Rare cards
      const hackerRareCards = [
        {
          cardId: 65797,
          setId: 1,
          name: 'Phantom DDoS',
          description: 'On Play: Glitch 3 on all enemies',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 3,
          cost: 4,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65798,
          setId: 1,
          name: 'Virus Overmind',
          description: 'Protocol: At start of each turn, enemies at this lane lose 1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 4,
          cost: 5,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65799,
          setId: 1,
          name: 'Null Agent',
          description: 'Silence a unit',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 2,
          cost: 3,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 65800,
          setId: 1,
          name: 'Black ICE',
          description: 'Target unit power becomes -1. If its Power was <1, draw 1',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'hacker',
          attributes: {}
        }
      ];

      // Hackers - Mythic cards
      const hackerMythicCards = [
        {
          cardId: 66051,
          setId: 1,
          name: 'CRT Abomination',
          description: 'Protocol: Glitches in this lane are permanent',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'unit',
          power: 5,
          cost: 6,
          faction: 'hacker',
          attributes: {}
        },
        {
          cardId: 66052,
          setId: 1,
          name: 'The Worm',
          description: 'Reduce unit Power by 1 per Hacker',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'spell',
          power: 0,
          cost: 2,
          faction: 'hacker',
          attributes: {}
        }
      ];

      // Droids - Common cards
      const droidCommonCards = [
        {
          cardId: 65557,
          setId: 1,
          name: 'Model-X Clone',
          description: 'On Death: Target Droid gets +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65558,
          setId: 1,
          name: 'Assembly Drone',
          description: 'On Play: Summon 1-Power Droid',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 2,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65559,
          setId: 1,
          name: 'Scrap Bot',
          description: 'On Death: All droids in this lane get +1 power until end of turn',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 3,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65560,
          setId: 1,
          name: 'Welder Unit',
          description: 'Protocol: Droids in this lane have +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 3,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65561,
          setId: 1,
          name: 'Nano Forge',
          description: 'Absorb: get +3 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 2,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65562,
          setId: 1,
          name: 'Patrol Drone',
          description: '',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65563,
          setId: 1,
          name: 'Defective Clone',
          description: 'Absorb: get +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 2,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65564,
          setId: 1,
          name: 'Hivemind Node',
          description: 'Protocol: Droids in this lane have +1 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 4,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65565,
          setId: 1,
          name: 'Salvage Bot',
          description: 'On death: Draw a card',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 1,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65566,
          setId: 1,
          name: 'Power Core',
          description: 'Give a Droid +4 Power this turn',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'droid',
          attributes: {}
        }
      ];

      // Droids - Rare cards
      const droidRareCards = [
        {
          cardId: 65801,
          setId: 1,
          name: 'Alpha Replicant',
          description: 'Protocol: Droids in this lane have +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 3,
          cost: 4,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65802,
          setId: 1,
          name: 'Swarm Queen',
          description: 'On Play: Summon two 1-Power Droids',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 2,
          cost: 5,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65803,
          setId: 1,
          name: 'Nano Reassembly',
          description: 'Summon 3-Power Droid, then it absorbs',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 65804,
          setId: 1,
          name: 'Nano Titan',
          description: 'Absorb. "On Death" effects trigger twice',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'unit',
          power: 5,
          cost: 4,
          faction: 'droid',
          attributes: {}
        }
      ];

      // Droids - Mythic cards
      const droidMythicCards = [
        {
          cardId: 66053,
          setId: 1,
          name: 'Riot Protocol',
          description: 'Target Droid absorbs any number of units, gains +1 Power per absorbed unit',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'spell',
          power: 0,
          cost: 6,
          faction: 'droid',
          attributes: {}
        },
        {
          cardId: 66054,
          setId: 1,
          name: 'Omega Constructor',
          description: 'Protocol: Absorbed Droids summon 1-Power copies',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'unit',
          power: 2,
          cost: 5,
          faction: 'droid',
          attributes: {}
        }
      ];

      // Neutral - Common cards
      const neutralCommonCards = [
        {
          cardId: 65567,
          setId: 1,
          name: 'Scavenger',
          description: 'On Death: Draw a card',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 1,
          cost: 1,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65568,
          setId: 1,
          name: 'Mercenary',
          description: '',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 3,
          cost: 2,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65569,
          setId: 1,
          name: 'Grenade',
          description: 'Reduce power of all Units in chosen lane by 2',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65570,
          setId: 1,
          name: 'Turbo Boost',
          description: 'Target unit gets +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 1,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65571,
          setId: 1,
          name: 'Wrecking Ball',
          description: 'Overclock: +3 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 5,
          cost: 4,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65572,
          setId: 1,
          name: 'Decoy',
          description: 'On Play: Summon 1-Power copy elsewhere',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 0,
          cost: 1,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65573,
          setId: 1,
          name: 'Junk Heap',
          description: 'On Death: Summon two 1-Power Bots',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'unit',
          power: 2,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65574,
          setId: 1,
          name: 'Patch Job',
          description: 'Unit with less than 3 power gets +2 Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 1,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65575,
          setId: 1,
          name: 'System Reboot',
          description: 'Reset target unit to base Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65576,
          setId: 1,
          name: 'Emergency Override',
          description: 'Reduce a unit\'s Power by 2. If it\'s a Droid, draw 1 card',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'common',
          type: 'spell',
          power: 0,
          cost: 2,
          faction: 'neutral',
          attributes: {}
        }
      ];

      // Neutral - Rare cards
      const neutralRareCards = [
        {
          cardId: 65805,
          setId: 1,
          name: 'Nanite Cloud',
          description: 'All units gain +1 Power this turn',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65806,
          setId: 1,
          name: 'Doomsday Device',
          description: 'Reduce all units\' power in lane by 3',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 5,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65807,
          setId: 1,
          name: 'Power Syphon',
          description: 'One target unit gets -2 power. One target unit gets +2 power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 65808,
          setId: 1,
          name: 'Hardened Alloy',
          description: 'Give a unit +2 Power this turn and it gains \'Protocol: Can\'t be reduced below 1 Power.\'',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'rare',
          type: 'spell',
          power: 0,
          cost: 3,
          faction: 'neutral',
          attributes: {}
        }
      ];

      // Neutral - Mythic cards
      const neutralMythicCards = [
        {
          cardId: 66055,
          setId: 1,
          name: 'The Glitch',
          description: 'Swap two lanes\' Units',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'spell',
          power: 0,
          cost: 6,
          faction: 'neutral',
          attributes: {}
        },
        {
          cardId: 66056,
          setId: 1,
          name: 'System Crash',
          description: 'Reset all to base Power',
          imageUrl: 'https://placeholder.com/300x400',
          rarity: 'mythic',
          type: 'spell',
          power: 0,
          cost: 6,
          faction: 'neutral',
          attributes: {}
        }
      ];

      // Insert all remaining cards
      await Card.insertMany([
        ...hackerRareCards,
        ...hackerMythicCards,
        ...droidCommonCards,
        ...droidRareCards,
        ...droidMythicCards,
        ...neutralCommonCards,
        ...neutralRareCards,
        ...neutralMythicCards
      ]);

      const totalNewCards = hackerRareCards.length + hackerMythicCards.length + 
                           droidCommonCards.length + droidRareCards.length + droidMythicCards.length +
                           neutralCommonCards.length + neutralRareCards.length + neutralMythicCards.length;

      console.log(`Successfully seeded ${totalNewCards} additional cards from all remaining factions`);
      console.log('All 4 factions completed: Gladiator, Hacker, Droid, Neutral');

    } catch (error) {
      console.error('Error seeding production cards:', error);
      throw error;
    }
  }

  /**
   * Clear production data
   */
  async clearProductionData(setId: number): Promise<void> {
    try {
      await Card.deleteMany({ setId });
      console.log('Production card data cleared successfully');
    } catch (error) {
      console.error('Error clearing production data:', error);
      throw error;
    }
  }
}

export default new ProductionDataService();
