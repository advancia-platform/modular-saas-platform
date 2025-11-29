/**
 * Alchemy Blockchain API Service
 *
 * Seamless onchain transactions for Advancia Pay Ledger
 * - Sponsor gas fees across Ethereum, Solana, Base, and 20+ chains
 * - Batch multiple actions into seamless one-click flows
 * - Access DeFi primitives like swaps through simple API calls
 *
 * @see https://www.alchemy.com/
 */

import { Alchemy, AlchemySettings, Network } from "alchemy-sdk";
import logger from "../logger";

// Supported networks configuration
export const SUPPORTED_NETWORKS: Record<string, Network> = {
  ethereum: Network.ETH_MAINNET,
  "ethereum-sepolia": Network.ETH_SEPOLIA,
  polygon: Network.MATIC_MAINNET,
  "polygon-mumbai": Network.MATIC_MUMBAI,
  arbitrum: Network.ARB_MAINNET,
  "arbitrum-sepolia": Network.ARB_SEPOLIA,
  optimism: Network.OPT_MAINNET,
  "optimism-sepolia": Network.OPT_SEPOLIA,
  base: Network.BASE_MAINNET,
  "base-sepolia": Network.BASE_SEPOLIA,
};

// Chain IDs for reference
export const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  "ethereum-sepolia": 11155111,
  polygon: 137,
  "polygon-mumbai": 80001,
  arbitrum: 42161,
  "arbitrum-sepolia": 421614,
  optimism: 10,
  "optimism-sepolia": 11155420,
  base: 8453,
  "base-sepolia": 84532,
  solana: 101, // Solana mainnet
  "solana-devnet": 102,
};

interface AlchemyConfig {
  apiKey: string;
  network: Network;
  maxRetries?: number;
}

interface TransactionRequest {
  to: string;
  from: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface GasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCostWei: string;
  estimatedCostEth: string;
}

interface BatchTransaction {
  transactions: TransactionRequest[];
  gasSponsored?: boolean;
}

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  symbol?: string;
  name?: string;
  decimals?: number;
}

interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  attributes?: Record<string, unknown>[];
}

class AlchemyService {
  private clients: Map<string, Alchemy> = new Map();
  private defaultNetwork: Network = Network.ETH_MAINNET;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ALCHEMY_API_KEY || "";

    if (!this.apiKey) {
      logger.warn(
        "ALCHEMY_API_KEY not configured - blockchain features will be limited",
      );
    } else {
      // Initialize default client
      this.initializeClient("ethereum");
      logger.info("Alchemy service initialized successfully");
    }
  }

  /**
   * Initialize Alchemy client for a specific network
   */
  private initializeClient(network: string): Alchemy {
    if (this.clients.has(network)) {
      return this.clients.get(network)!;
    }

    const alchemyNetwork = SUPPORTED_NETWORKS[network] || this.defaultNetwork;

    const config: AlchemySettings = {
      apiKey: this.apiKey,
      network: alchemyNetwork,
      maxRetries: 3,
    };

    const client = new Alchemy(config);
    this.clients.set(network, client);

    logger.info(`Alchemy client initialized for network: ${network}`);
    return client;
  }

  /**
   * Get Alchemy client for a specific network
   */
  getClient(network: string = "ethereum"): Alchemy {
    if (!this.apiKey) {
      throw new Error("Alchemy API key not configured");
    }
    return this.initializeClient(network);
  }

  /**
   * Get current gas prices for a network
   */
  async getGasPrices(network: string = "ethereum"): Promise<{
    slow: string;
    standard: string;
    fast: string;
    baseFee: string;
  }> {
    const client = this.getClient(network);

    try {
      const feeData = await client.core.getFeeData();
      const baseFee = feeData.lastBaseFeePerGas?.toString() || "0";

      return {
        slow: feeData.maxFeePerGas?.toString() || "0",
        standard: feeData.maxFeePerGas?.toString() || "0",
        fast: feeData.maxFeePerGas?.toString() || "0",
        baseFee,
      };
    } catch (error) {
      logger.error("Error fetching gas prices:", error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    transaction: TransactionRequest,
    network: string = "ethereum",
  ): Promise<GasEstimate> {
    const client = this.getClient(network);

    try {
      const [gasLimit, feeData] = await Promise.all([
        client.core.estimateGas({
          to: transaction.to,
          from: transaction.from,
          value: transaction.value,
          data: transaction.data,
        }),
        client.core.getFeeData(),
      ]);

      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt() || BigInt(0);
      const estimatedCostWei = gasLimit.toBigInt() * maxFeePerGas;

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || "0",
        estimatedCostWei: estimatedCostWei.toString(),
        estimatedCostEth: (Number(estimatedCostWei) / 1e18).toFixed(8),
      };
    } catch (error) {
      logger.error("Error estimating gas:", error);
      throw error;
    }
  }

  /**
   * Get native token balance (ETH, MATIC, etc.)
   */
  async getNativeBalance(
    address: string,
    network: string = "ethereum",
  ): Promise<string> {
    const client = this.getClient(network);

    try {
      const balance = await client.core.getBalance(address);
      return balance.toString();
    } catch (error) {
      logger.error("Error fetching native balance:", error);
      throw error;
    }
  }

  /**
   * Get ERC-20 token balances for an address
   */
  async getTokenBalances(
    address: string,
    network: string = "ethereum",
  ): Promise<TokenBalance[]> {
    const client = this.getClient(network);

    try {
      const balances = await client.core.getTokenBalances(address);

      // Get token metadata for non-zero balances
      const nonZeroBalances = balances.tokenBalances.filter(
        (token) => token.tokenBalance && token.tokenBalance !== "0x0",
      );

      const enrichedBalances: TokenBalance[] = await Promise.all(
        nonZeroBalances.map(async (token) => {
          try {
            const metadata = await client.core.getTokenMetadata(
              token.contractAddress,
            );
            return {
              contractAddress: token.contractAddress,
              tokenBalance: token.tokenBalance || "0",
              symbol: metadata.symbol || undefined,
              name: metadata.name || undefined,
              decimals: metadata.decimals || undefined,
            };
          } catch {
            return {
              contractAddress: token.contractAddress,
              tokenBalance: token.tokenBalance || "0",
            };
          }
        }),
      );

      return enrichedBalances;
    } catch (error) {
      logger.error("Error fetching token balances:", error);
      throw error;
    }
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(
    address: string,
    network: string = "ethereum",
  ): Promise<NFTMetadata[]> {
    const client = this.getClient(network);

    try {
      const nfts = await client.nft.getNftsForOwner(address);

      return nfts.ownedNfts.map((nft) => ({
        tokenId: nft.tokenId,
        contractAddress: nft.contract.address,
        name: nft.name || undefined,
        description: nft.description || undefined,
        imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || undefined,
        attributes: nft.raw?.metadata?.attributes as
          | Record<string, unknown>[]
          | undefined,
      }));
    } catch (error) {
      logger.error("Error fetching NFTs:", error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    network: string = "ethereum",
    options: { fromBlock?: string; toBlock?: string; maxCount?: number } = {},
  ) {
    const client = this.getClient(network);

    try {
      const transfers = await client.core.getAssetTransfers({
        fromAddress: address,
        fromBlock: options.fromBlock || "0x0",
        toBlock: options.toBlock || "latest",
        maxCount: options.maxCount || 100,
        category: ["external", "erc20", "erc721", "erc1155"],
        withMetadata: true,
      });

      return transfers.transfers.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value?.toString() || "0",
        asset: tx.asset,
        category: tx.category,
        blockNumber: tx.blockNum,
        timestamp: tx.metadata?.blockTimestamp,
      }));
    } catch (error) {
      logger.error("Error fetching transaction history:", error);
      throw error;
    }
  }

  /**
   * Monitor pending transactions (mempool)
   */
  async subscribeToPendingTransactions(
    address: string,
    callback: (tx: unknown) => void,
    network: string = "ethereum",
  ): Promise<() => void> {
    const client = this.getClient(network);

    try {
      // Use websocket subscription for pending transactions
      const ws = client.ws;

      ws.on(
        { method: "alchemy_pendingTransactions", toAddress: address },
        callback,
      );

      logger.info(`Subscribed to pending transactions for: ${address}`);

      // Return unsubscribe function
      return () => {
        ws.off({ method: "alchemy_pendingTransactions", toAddress: address });
        logger.info(`Unsubscribed from pending transactions for: ${address}`);
      };
    } catch (error) {
      logger.error("Error subscribing to pending transactions:", error);
      throw error;
    }
  }

  /**
   * Simulate a transaction without broadcasting
   */
  async simulateTransaction(
    transaction: TransactionRequest,
    network: string = "ethereum",
  ): Promise<{ success: boolean; gasUsed: string; error?: string }> {
    const client = this.getClient(network);

    try {
      // Use eth_call to simulate
      const result = await client.core.call({
        to: transaction.to,
        from: transaction.from,
        value: transaction.value,
        data: transaction.data,
      });

      return {
        success: true,
        gasUsed: "0", // Would need trace for exact gas
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        gasUsed: "0",
        error: errorMessage,
      };
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(network: string = "ethereum"): Promise<number> {
    const client = this.getClient(network);
    return await client.core.getBlockNumber();
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENS(
    name: string,
    network: string = "ethereum",
  ): Promise<string | null> {
    const client = this.getClient(network);

    try {
      return await client.core.resolveName(name);
    } catch (error) {
      logger.error("Error resolving ENS:", error);
      return null;
    }
  }

  /**
   * Lookup address to ENS name
   */
  async lookupAddress(
    address: string,
    network: string = "ethereum",
  ): Promise<string | null> {
    const client = this.getClient(network);

    try {
      return await client.core.lookupAddress(address);
    } catch (error) {
      logger.error("Error looking up address:", error);
      return null;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get list of supported networks
   */
  getSupportedNetworks(): string[] {
    return Object.keys(SUPPORTED_NETWORKS);
  }
}

// Export singleton instance
export const alchemyService = new AlchemyService();
export default alchemyService;
