import { ethers } from "ethers";

// Initialize Ethereum provider using public RPC endpoint
// Using Ethereum's public RPC endpoint (no API key required)
const providerUrl = process.env.ETH_PROVIDER_URL || "https://ethereum.publicnode.com";

// Lazy initialization of provider with explicit network configuration
let provider: ethers.providers.JsonRpcProvider | null = null;

function getProvider(): ethers.providers.JsonRpcProvider {
  if (!provider) {
    // Create provider with explicit network configuration to avoid network detection issues
    const network = ethers.providers.getNetwork("homestead"); // "homestead" is Ethereum mainnet
    provider = new ethers.providers.JsonRpcProvider(providerUrl, network);
  }
  return provider;
}

/**
 * Get ETH balance for a wallet address
 * @param address - Ethereum wallet address (0x...)
 * @returns Balance in ETH (as a number)
 */
export async function getEthBalance(address: string): Promise<number> {
  try {
    if (!ethers.utils.isAddress(address)) {
      throw new Error("Invalid Ethereum address");
    }
    
    const balance = await getProvider().getBalance(address);
    return parseFloat(ethers.utils.formatEther(balance));
  } catch (error) {
    console.error("Error fetching ETH balance:", error);
    throw new Error(`Failed to fetch ETH balance: ${error}`);
  }
}

/**
 * Get current gas price
 * @returns Gas price in Gwei
 */
export async function getGasPrice(): Promise<number> {
  try {
    const gasPrice = await getProvider().getGasPrice();
    return parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));
  } catch (error) {
    console.error("Error fetching gas price:", error);
    throw new Error(`Failed to fetch gas price: ${error}`);
  }
}

/**
 * Get current block number
 * @returns Current Ethereum block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
  try {
    return await getProvider().getBlockNumber();
  } catch (error) {
    console.error("Error fetching block number:", error);
    throw new Error(`Failed to fetch block number: ${error}`);
  }
}

/**
 * Get transaction by hash
 * @param txHash - Transaction hash
 * @returns Transaction details
 */
export async function getTransaction(txHash: string) {
  try {
    return await getProvider().getTransaction(txHash);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw new Error(`Failed to fetch transaction: ${error}`);
  }
}

/**
 * Get transaction receipt
 * @param txHash - Transaction hash
 * @returns Transaction receipt with status
 */
export async function getTransactionReceipt(txHash: string) {
  try {
    return await getProvider().getTransactionReceipt(txHash);
  } catch (error) {
    console.error("Error fetching transaction receipt:", error);
    throw new Error(`Failed to fetch transaction receipt: ${error}`);
  }
}

/**
 * Send ETH transaction (for withdrawals)
 * @param fromPrivateKey - Private key of sender wallet (admin/hot wallet)
 * @param toAddress - Recipient address
 * @param amountEth - Amount in ETH to send
 * @returns Transaction hash
 */
export async function sendEthTransaction(
  fromPrivateKey: string,
  toAddress: string,
  amountEth: number
): Promise<string> {
  try {
    if (!ethers.utils.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    const wallet = new ethers.Wallet(fromPrivateKey, getProvider());
    
    // Check sender balance
    const balance = await wallet.getBalance();
    const amountWei = ethers.utils.parseEther(amountEth.toString());
    
    if (balance.lt(amountWei)) {
      throw new Error("Insufficient balance for transaction");
    }

    // Estimate gas
    const gasLimit = await getProvider().estimateGas({
      to: toAddress,
      value: amountWei,
    });

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
      gasLimit: gasLimit,
    });

    console.log(`ETH transaction sent: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Error sending ETH transaction:", error);
    throw new Error(`Failed to send ETH transaction: ${error}`);
  }
}

/**
 * Verify transaction status
 * @param txHash - Transaction hash
 * @returns True if confirmed, false if pending, throws if failed
 */
export async function verifyTransaction(txHash: string): Promise<boolean> {
  try {
    const receipt = await getTransactionReceipt(txHash);
    
    if (!receipt) {
      return false; // Still pending
    }

    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    return receipt.status === 1; // Success
  } catch (error) {
    console.error("Error verifying transaction:", error);
    throw error;
  }
}

/**
 * Estimate gas cost for ETH transfer
 * @param toAddress - Recipient address
 * @param amountEth - Amount in ETH
 * @returns Estimated gas cost in ETH
 */
export async function estimateTransferCost(
  toAddress: string,
  amountEth: number
): Promise<{ gasLimit: number; gasPriceGwei: number; estimatedCostEth: number }> {
  try {
    const normalizedAddress = ethers.utils.getAddress(toAddress);
    const amountWei = ethers.utils.parseEther(amountEth.toString());
    
    // Estimate gas limit
    const gasLimit = await getProvider().estimateGas({
      to: normalizedAddress,
      value: amountWei,
    });

    // Get current gas price
    const gasPrice = await getProvider().getGasPrice();
    const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));

    // Calculate total cost
    const totalCostWei = gasLimit.mul(gasPrice);
    const estimatedCostEth = parseFloat(ethers.utils.formatEther(totalCostWei));

    return {
      gasLimit: gasLimit.toNumber(),
      gasPriceGwei,
      estimatedCostEth,
    };
  } catch (error) {
    console.error("Error estimating transfer cost:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to estimate transfer cost: ${message}`);
  }
}

/**
 * Check if provider is connected
 * @returns True if connected to Ethereum network
 */
export async function isProviderConnected(): Promise<boolean> {
  try {
    await getProvider().getBlockNumber();
    return true;
  } catch (error) {
    console.error("Provider connection error:", error);
    return false;
  }
}

/**
 * Get network information
 * @returns Network name and chain ID
 */
export async function getNetworkInfo() {
  try {
    const network = await getProvider().getNetwork();
    return {
      name: network.name,
      chainId: network.chainId,
    };
  } catch (error) {
    console.error("Error fetching network info:", error);
    throw new Error(`Failed to fetch network info: ${error}`);
  }
}

export { provider };
