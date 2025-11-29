/**
 * Alchemy Blockchain API Routes
 *
 * Seamless onchain transactions for Advancia Pay Ledger
 * Endpoints for gas estimation, balance checks, NFTs, and transaction history
 */

import { Request, Response, Router } from "express";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";
import { validateInput } from "../middleware/security";
import alchemyService, {
  CHAIN_IDS,
  SUPPORTED_NETWORKS,
} from "../services/alchemyService";

const router = Router();

/**
 * GET /api/blockchain/networks
 * Get list of supported blockchain networks
 */
router.get("/networks", (_req: Request, res: Response) => {
  res.json({
    success: true,
    networks: Object.keys(SUPPORTED_NETWORKS),
    chainIds: CHAIN_IDS,
  });
});

/**
 * GET /api/blockchain/status
 * Check Alchemy service status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const network = (req.query.network as string) || "ethereum";

    if (!alchemyService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Blockchain service not configured",
        configured: false,
      });
    }

    const blockNumber = await alchemyService.getBlockNumber(network);

    res.json({
      success: true,
      configured: true,
      network,
      blockNumber,
      supportedNetworks: alchemyService.getSupportedNetworks(),
    });
  } catch (error) {
    logger.error("Error checking blockchain status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check blockchain status",
    });
  }
});

/**
 * GET /api/blockchain/gas-prices
 * Get current gas prices for a network
 */
router.get(
  "/gas-prices",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const network = (req.query.network as string) || "ethereum";

      const gasPrices = await alchemyService.getGasPrices(network);

      res.json({
        success: true,
        network,
        gasPrices,
      });
    } catch (error) {
      logger.error("Error fetching gas prices:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch gas prices",
      });
    }
  },
);

/**
 * POST /api/blockchain/estimate-gas
 * Estimate gas for a transaction
 */
router.post(
  "/estimate-gas",
  authenticateToken,
  validateInput,
  async (req: Request, res: Response) => {
    try {
      const { to, from, value, data, network = "ethereum" } = req.body;

      if (!to || !from) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: to, from",
        });
      }

      const estimate = await alchemyService.estimateGas(
        { to, from, value, data },
        network,
      );

      res.json({
        success: true,
        network,
        estimate,
      });
    } catch (error) {
      logger.error("Error estimating gas:", error);
      res.status(500).json({
        success: false,
        error: "Failed to estimate gas",
      });
    }
  },
);

/**
 * GET /api/blockchain/balance/:address
 * Get native token balance for an address
 */
router.get(
  "/balance/:address",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const network = (req.query.network as string) || "ethereum";

      const balance = await alchemyService.getNativeBalance(address, network);
      const balanceInEth = (Number(balance) / 1e18).toFixed(8);

      res.json({
        success: true,
        address,
        network,
        balanceWei: balance,
        balance: balanceInEth,
      });
    } catch (error) {
      logger.error("Error fetching balance:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch balance",
      });
    }
  },
);

/**
 * GET /api/blockchain/tokens/:address
 * Get ERC-20 token balances for an address
 */
router.get(
  "/tokens/:address",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const network = (req.query.network as string) || "ethereum";

      const tokens = await alchemyService.getTokenBalances(address, network);

      res.json({
        success: true,
        address,
        network,
        tokens,
        count: tokens.length,
      });
    } catch (error) {
      logger.error("Error fetching token balances:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch token balances",
      });
    }
  },
);

/**
 * GET /api/blockchain/nfts/:address
 * Get NFTs owned by an address
 */
router.get(
  "/nfts/:address",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const network = (req.query.network as string) || "ethereum";

      const nfts = await alchemyService.getNFTs(address, network);

      res.json({
        success: true,
        address,
        network,
        nfts,
        count: nfts.length,
      });
    } catch (error) {
      logger.error("Error fetching NFTs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch NFTs",
      });
    }
  },
);

/**
 * GET /api/blockchain/transactions/:address
 * Get transaction history for an address
 */
router.get(
  "/transactions/:address",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const network = (req.query.network as string) || "ethereum";
      const maxCount = parseInt(req.query.limit as string) || 50;

      const transactions = await alchemyService.getTransactionHistory(
        address,
        network,
        {
          maxCount,
        },
      );

      res.json({
        success: true,
        address,
        network,
        transactions,
        count: transactions.length,
      });
    } catch (error) {
      logger.error("Error fetching transaction history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch transaction history",
      });
    }
  },
);

/**
 * POST /api/blockchain/simulate
 * Simulate a transaction without broadcasting
 */
router.post(
  "/simulate",
  authenticateToken,
  validateInput,
  async (req: Request, res: Response) => {
    try {
      const { to, from, value, data, network = "ethereum" } = req.body;

      if (!to || !from) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: to, from",
        });
      }

      const result = await alchemyService.simulateTransaction(
        { to, from, value, data },
        network,
      );

      res.json({
        success: true,
        network,
        simulation: result,
      });
    } catch (error) {
      logger.error("Error simulating transaction:", error);
      res.status(500).json({
        success: false,
        error: "Failed to simulate transaction",
      });
    }
  },
);

/**
 * GET /api/blockchain/ens/resolve/:name
 * Resolve ENS name to address
 */
router.get("/ens/resolve/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const address = await alchemyService.resolveENS(name);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: "ENS name not found",
      });
    }

    res.json({
      success: true,
      name,
      address,
    });
  } catch (error) {
    logger.error("Error resolving ENS:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resolve ENS name",
    });
  }
});

/**
 * GET /api/blockchain/ens/lookup/:address
 * Lookup address to ENS name
 */
router.get("/ens/lookup/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const name = await alchemyService.lookupAddress(address);

    res.json({
      success: true,
      address,
      name: name || null,
    });
  } catch (error) {
    logger.error("Error looking up address:", error);
    res.status(500).json({
      success: false,
      error: "Failed to lookup address",
    });
  }
});

export default router;
