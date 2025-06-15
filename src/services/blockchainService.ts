import dotenv from 'dotenv';
import { ethers, LogDescription } from 'ethers';
import cardService from './cardService';

dotenv.config();

// Full ABI for the Cardpool contract to capture all events
const CARDPOOL_ABI = [
  // ERC1155 events
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] rawIds, uint256[] rawValues)",
  "event URI(string value, uint256 indexed id)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",

  // VRF events
  "event RequestFulfilled(uint256 requestId, uint256[] randomWords)",

  // Cardpool specific events
  "event OwnershipTransferRequested(address indexed from, address indexed to)",
  "event OwnershipTransferred(address indexed from, address indexed to)",
  "event CoordinatorSet(address vrfCoordinator)",

  // Functions
  "function acceptOwnership()",
  "function addExtenstion(uint16 extension, uint8 commonCount, uint8 rareCount, uint8 mythicCount)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function burn(uint32 id, uint256 amount)",
  "function burnBatch(uint256[] ids, uint256[] amounts)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function mintInitial(address to)",
  "function mintPack(uint16 extensionId, address to, bool native) returns (uint256)",
  "function owner() view returns (address)",
  "function rawFulfillRandomWords(uint256 requestId, uint256[] randomWords)",
  "function retireExtension(uint16 extension)",
  "function rollbackRetirement(uint16 extension)",
  "function s_vrfCoordinator() view returns (address)",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] values, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function setCoordinator(address _vrfCoordinator)",
  "function splitUint256ToUint32Array(uint256 value) pure returns (uint32[])",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function transferOwnership(address to)",
  "function updateInitialSet((uint32 id, uint256 quantity)[] newSet)",
  "function updateInitialSetPrice(uint256 newPrice)",
  "function updatePackPrice(uint256 newPrice)",
  "function uri(uint256) view returns (string)",
  "function userCards(address user) view returns ((uint32 id, uint256 quantity)[])"
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private cardpoolContract: ethers.Contract;
  private isMonitoring: boolean = false;
  private lastProcessedBlock: number = 0;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 15000; // 15 seconds
  private readonly RECONNECT_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    // Initialize provider and contract
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    const wsUrl = process.env.BLOCKCHAIN_WS_URL || 'wss://api.avax-test.network/ext/bc/C/ws';
    // Using the contract address from the request
    const contractAddress = process.env.CARDPOOL_CONTRACT_ADDRESS || '0x6e0647075e8607733b3AaDEdFB376a66C41E8f2e';

    console.log(`Initializing BlockchainService with contract address: ${contractAddress}`);

    // Initialize HTTP provider for historical data
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize WebSocket provider for real-time events
    try {
      this.wsProvider = new ethers.WebSocketProvider(wsUrl);
      console.log('WebSocket provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebSocket provider:', error);
      console.log('Falling back to HTTP provider for events');
      this.wsProvider = null;
    }

    // Use WebSocket provider for contract if available, otherwise use HTTP provider
    const eventProvider = this.wsProvider || this.provider;
    this.cardpoolContract = new ethers.Contract(contractAddress, CARDPOOL_ABI, eventProvider);

    // Load last processed block from environment or start from 0
    this.loadLastProcessedBlock();
  }

  /**
   * Load the last processed block from environment variable
   */
  private loadLastProcessedBlock(): void {
    this.lastProcessedBlock = parseInt(process.env.LAST_PROCESSED_BLOCK || '0');
    console.log(`Starting from block: ${this.lastProcessedBlock}`);
  }

  /**
   * Save the last processed block (in memory only for now)
   */
  private saveLastProcessedBlock(blockNumber: number): void {
    this.lastProcessedBlock = blockNumber;
    console.log(`Updated last processed block to: ${blockNumber}`);
  }

  /**
   * Start monitoring the blockchain using both event listeners and polling
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Blockchain monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting blockchain monitoring...');

    try {
      // Process historical events first
      await this.processHistoricalEvents();

      // Set up real-time event listeners
      this.setupEventListeners();

      // Set up polling for new blocks as a backup mechanism
      this.pollingInterval = setInterval(async() => {
        try {
          await this.processHistoricalEvents();
        } catch (error) {
          console.error('Error in polling interval:', error);
        }
      }, this.POLLING_INTERVAL_MS);

      console.log(`Blockchain monitoring started successfully with polling interval of ${this.POLLING_INTERVAL_MS / 1000} seconds`);
    } catch (error) {
      this.isMonitoring = false;
      console.error('Error starting blockchain monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop blockchain monitoring
   */
  public async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Blockchain monitoring is not running');
      return;
    }

    try {
      // Stop polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Stop reconnection attempts
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // Remove all event listeners
      this.removeEventListeners();

      this.isMonitoring = false;
      console.log('Blockchain monitoring stopped');
    } catch (error) {
      console.error('Error stopping blockchain monitoring:', error);
      throw error;
    }
  }

  /**
   * Process historical events from the last processed block
   */
  private async processHistoricalEvents(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      let fromBlock = this.lastProcessedBlock + 1;

      if (fromBlock >= currentBlock) {
        console.log('No new blocks to process');
        return;
      }

      // Maximum number of blocks to process at once (to avoid RPC limitations)
      const BLOCK_CHUNK_SIZE = 2000;

      console.log(`Processing historical events from block ${fromBlock} to ${currentBlock} in chunks of ${BLOCK_CHUNK_SIZE} blocks`);

      // Process blocks in chunks
      while (fromBlock <= currentBlock) {
        const zero = ethers.ZeroAddress;
        const toBlock = Math.min(fromBlock + BLOCK_CHUNK_SIZE - 1, currentBlock);

        console.log(`Processing chunk from block ${fromBlock} to ${toBlock}`);

        // Get all events from the contract
        const filter = this.cardpoolContract.filters.TransferBatch(
          null,    // operator — любой
          zero,    // from == 0x0…0
          null     // to — любой
        );
        // const events = await this.cardpoolContract.queryFilter(filter, fromBlock, toBlock);
        const events = await this.cardpoolContract.queryFilter('*', fromBlock, toBlock);

        console.log(`Found ${events.length} total events in blocks ${fromBlock}-${toBlock}`);

        // Process each event
        for (const event of events) {
          await this.logEvent(event);
        }

        // Save the last processed block
        this.saveLastProcessedBlock(toBlock);

        // Move to the next chunk
        fromBlock = toBlock + 1;
      }

      console.log(`All historical events processed up to block ${currentBlock}`);
    } catch (error) {
      console.error('Error processing historical events:', error);
    }
  }

  /**
   * Set up event listeners for real-time monitoring
   */
  private setupEventListeners(): void {
    console.log('Setting up event listeners for real-time monitoring');

    // Listen for all events
    this.cardpoolContract.on('*', async (event) => {
      await this.logEvent(event.log);
    });

    // Set up WebSocket reconnection if using WebSocket provider
    if (this.wsProvider) {
      // Handle WebSocket disconnection
      this.wsProvider.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.reconnectWebSocket();
      });

      // Note: ethers.js v6 WebSocketProvider doesn't support 'close' event
      // We'll rely on error events and periodic health checks

      // Set up periodic health check for WebSocket connection
      setInterval(() => {
        if (this.wsProvider && this.isMonitoring) {
          this.wsProvider.getBlockNumber().catch(error => {
            console.error('WebSocket health check failed:', error);
            this.reconnectWebSocket();
          });
        }
      }, 60000); // Check every minute

      console.log('WebSocket reconnection handlers set up');
    }

    console.log('Event listeners set up successfully');
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    console.log('Removing event listeners');

    // Remove contract event listeners
    this.cardpoolContract.removeAllListeners();

    // Remove WebSocket event listeners if applicable
    if (this.wsProvider) {
      this.wsProvider.removeAllListeners();

      // Close WebSocket connection
      try {
        this.wsProvider.destroy();
        console.log('WebSocket connection closed');
      } catch (error) {
        console.error('Error closing WebSocket connection:', error);
      }
    }

    // Clear reconnect interval if it exists
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    console.log('All event listeners removed');
  }

  /**
   * Log event details to console
   * @param event - The blockchain event to log
   */
  private async logEvent(raw: ethers.EventLog | ethers.Log | any): Promise<void> {
    console.log('──────────────────────────────────');

    let parsedLog: LogDescription | null;
    try {
      parsedLog = this.cardpoolContract.interface.parseLog(raw);
    } catch (e) {
      console.log(`→ Unrecognized log ${JSON.stringify(raw)}`);
      console.log('──────────────────────────────────');
      return;
    }


    console.log(`Event:        ${parsedLog?.name}`);
    console.log(`Block:        ${raw.blockNumber}`);
    console.log(`Transaction:  ${raw.transactionHash}`);

    // Process specific events
    if (parsedLog?.name === 'TransferBatch') {
      await this.handleTransferBatchEvent(raw);
    }
  }

  /**
   * Format argument for logging (handle BigInt)
   * @param arg - The argument to format
   * @returns Formatted argument with BigInt converted to string
   */
  private formatArg(arg: unknown): unknown {
    if (arg === null || arg === undefined) {
      return arg;
    }

    // Handle BigInt
    if (typeof arg === 'bigint') {
      return arg.toString();
    }

    // Handle arrays
    if (Array.isArray(arg)) {
      return arg.map(item => this.formatArg(item));
    }

    // Handle objects
    if (typeof arg === 'object' && arg !== null) {
      return Object.fromEntries(
        Object.entries(arg as Record<string, unknown>).map(([key, value]) => [key, this.formatArg(value)])
      );
    }

    return arg;
  }


  /**
   * Handle TransferBatch event
   * @param parsedLog - The parsed log of the TransferBatch event
   * @param raw - The raw event data
   */
  private async handleTransferBatchEvent(raw: ethers.EventLog | ethers.Log | any): Promise<void> {
    try {
      // Extract event arguments
      const {operator, from, to, rawIds, rawValues} = raw.args;

      console.log('TransferBatch Event Detected:');
      console.log(`Operator: ${operator}`);
      console.log(`From: ${from}`);
      console.log(`To: ${to}`);

      // Ensure ids and values are arrays we can iterate over
      const idsArray = rawIds.map((bn: any) => bn);
      const valuesArray = rawValues.map((bn: any) => bn);

      console.log(`IDs: ${idsArray.map((id: any) => this.formatArg(id)).join(', ')}`);
      console.log(`Values: ${valuesArray.map((value: any) => this.formatArg(value)).join(', ')}`);

      // Process each card in the batch
      console.log('Cards transferred:');
      for (let i = 0; i < idsArray.length; i++) {
        const item = idsArray[i];
        const quantity = Number(valuesArray[i]);

        const idWithinRarity = Number(item & 0xffn);
        const rarity = Number((item >> 8n) & 0xffn);
        const setId = Number(item >> 16n);

        // Generate a unique cardId based on the card's properties
        const cardId = Number(item);

        console.log(`Full Card ID: ${this.formatArg(idsArray[i])}, Set ID: ${setId}, Rarity ID: ${rarity}, ID within Rarity: ${idWithinRarity}, Quantity: ${quantity}`);

        // Add the card to the user's collection
        const blockNumber = raw.blockNumber ? Number(raw.blockNumber) : 0;
        await cardService.addCardToUser(to, cardId, quantity, blockNumber);
        console.log(`Added card ${cardId} with quantity ${quantity} to user ${to} at block ${blockNumber}`);
      }

      console.log('TransferBatch event processed successfully');
    } catch (error) {
      console.error('Error processing TransferBatch event:', error);
    }
  }

  /**
   * Reconnect WebSocket provider
   */
  private reconnectWebSocket(): void {
    if (this.reconnectInterval) {
      // Already trying to reconnect
      return;
    }

    console.log('Setting up WebSocket reconnection');

    this.reconnectInterval = setInterval(() => {
      try {
        console.log('Attempting to reconnect WebSocket...');
        const wsUrl = process.env.BLOCKCHAIN_WS_URL || 'wss://api.avax-test.network/ext/bc/C/ws';
        const contractAddress = process.env.CARDPOOL_CONTRACT_ADDRESS || '0x6e0647075e8607733b3AaDEdFB376a66C41E8f2e';

        // Create new WebSocket provider
        this.wsProvider = new ethers.WebSocketProvider(wsUrl);

        // Recreate contract with new provider
        this.cardpoolContract = new ethers.Contract(contractAddress, CARDPOOL_ABI, this.wsProvider);

        // Set up event listeners again
        this.setupEventListeners();

        // Clear reconnect interval
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }

        console.log('WebSocket reconnected successfully');
      } catch (error) {
        console.error('Failed to reconnect WebSocket:', error);
      }
    }, this.RECONNECT_INTERVAL_MS);
  }
}

export default new BlockchainService();
