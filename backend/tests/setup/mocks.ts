// @ts-nocheck
import { jest } from "@jest/globals";

/**
 * Mock Cryptomus API responses
 */
export const mockCryptomusAPI: any = {
  createInvoice: jest.fn().mockResolvedValue({
    uuid: "test-invoice-uuid",
    order_id: "test-order-123",
    amount: "100.00",
    currency: "USD",
    url: "https://cryptomus.com/pay/test-invoice",
    expired_at: new Date(Date.now() + 3600000).toISOString(),
    status: "pending",
  } as any),

  getInvoiceStatus: jest.fn().mockResolvedValue({
    uuid: "test-invoice-uuid",
    status: "paid",
    payment_amount: "100.00",
    payer_amount: "100.00",
    txid: "test-transaction-hash",
    network: "ETH",
  } as any),

  verifyWebhookSignature: jest.fn().mockReturnValue(true as any),

  createPayout: jest.fn().mockResolvedValue({
    uuid: "test-payout-uuid",
    order_id: "test-payout-123",
    amount: "50.00",
    currency: "USD",
    status: "processing",
  } as any),
};

/**
 * Mock Email service (nodemailer)
 */
export const mockEmailService: any = {
  sendMail: jest.fn().mockResolvedValue({
    messageId: "<test-message-id@example.com>",
    accepted: ["test@example.com"],
    rejected: [],
    response: "250 Message accepted",
  } as any),

  verifyConnection: jest.fn().mockResolvedValue(true as any),

  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: "<test-message-id@example.com>",
      accepted: ["test@example.com"],
    } as any),
    verify: jest.fn().mockResolvedValue(true as any),
  } as any),
};

/**
 * Mock blockchain network for crypto operations
 */
export const mockBlockchainNetwork: any = {
  getBalance: jest.fn().mockResolvedValue("1000000000000000000" as any), // 1 ETH in wei

  estimateGas: jest.fn().mockResolvedValue("21000" as any),

  getGasPrice: jest.fn().mockResolvedValue("20000000000" as any), // 20 gwei

  sendTransaction: jest.fn().mockResolvedValue({
    hash: "0xtest-transaction-hash-1234567890abcdef",
    from: "0xTestSenderAddress1234567890abcdef12345678",
    to: "0xTestReceiverAddress1234567890abcdef12345678",
    value: "1000000000000000000",
    nonce: 1,
    wait: jest.fn().mockResolvedValue({
      status: 1,
      blockNumber: 12345,
      transactionHash: "0xtest-transaction-hash-1234567890abcdef",
      confirmations: 6,
    } as any),
  } as any),

  validateAddress: jest.fn(((address: string) => {
    // Ethereum address validation
    if (address.startsWith("0x") && address.length === 42) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    // Bitcoin address validation (simplified)
    if (address.length >= 26 && address.length <= 35) {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
    }
    return false;
  }) as any),

  getTransactionReceipt: jest.fn().mockResolvedValue({
    status: 1,
    blockNumber: 12345,
    gasUsed: "21000",
    effectiveGasPrice: "20000000000",
  } as any),

  simulateCongestion: jest.fn().mockResolvedValue({
    congested: false,
    gasPrice: "20000000000",
    estimatedTime: 60, // seconds
  } as any),
};

/**
 * Test fixtures for admin users
 */
export const adminUserFixture = {
  id: "test-admin-id-" + Date.now(),
  email: "admin@test.com",
  username: "testadmin",
  role: "ADMIN" as const,
  approved: true,
  emailVerified: true,
  active: true,
  passwordHash: "$2a$10$mockHashedPasswordForTesting",
  usdBalance: 10000,
  btcBalance: 1,
  ethBalance: 10,
  usdtBalance: 5000,
};

/**
 * Test fixtures for regular users
 */
export const regularUserFixture = {
  id: "test-user-id-" + Date.now(),
  email: "user@test.com",
  username: "testuser",
  role: "USER" as const,
  approved: true,
  emailVerified: true,
  active: true,
  passwordHash: "$2a$10$mockHashedPasswordForTesting",
  usdBalance: 1000,
  btcBalance: 0.1,
  ethBalance: 1,
  usdtBalance: 500,
};

/**
 * Mock crypto withdrawal request
 */
export const mockCryptoWithdrawal = {
  id: "test-withdrawal-id",
  userId: "test-user-id",
  currency: "ETH" as const,
  amount: "0.5",
  address: "0xTestReceiverAddress1234567890abcdef12345678",
  status: "pending" as const,
  fee: "0.001",
  networkFee: "0.0005",
  txHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock webhook payload from Cryptomus
 */
export const mockCryptomusWebhook = {
  uuid: "test-invoice-uuid",
  order_id: "test-order-123",
  amount: "100.00",
  payment_amount: "100.00",
  payer_amount: "100.00",
  currency: "USD",
  payment_status: "paid",
  txid: "test-transaction-hash",
  network: "ETH",
  address: "0xTestAddress1234567890abcdef12345678",
  from: "0xPayerAddress1234567890abcdef12345678",
  sign: "test-signature-hash",
};

/**
 * Fee calculation helpers
 */
export const feeCalculator = {
  calculateNetworkFee: (currency: string, gasPrice?: string) => {
    const fees = {
      BTC: "0.0001",
      ETH: gasPrice
        ? ((parseFloat(gasPrice) * 21000) / 1e18).toString()
        : "0.001",
      USDT: "0.5",
    };
    return fees[currency as keyof typeof fees] || "0.001";
  },

  calculateServiceFee: (amount: string, currency: string) => {
    const feePercentage = 0.01; // 1%
    return (parseFloat(amount) * feePercentage).toFixed(8);
  },

  calculateTotalFee: (amount: string, currency: string, gasPrice?: string) => {
    const networkFee = parseFloat(
      feeCalculator.calculateNetworkFee(currency, gasPrice),
    );
    const serviceFee = parseFloat(
      feeCalculator.calculateServiceFee(amount, currency),
    );
    return (networkFee + serviceFee).toFixed(8);
  },
};

/**
 * Address validators
 */
export const addressValidators = {
  isValidBitcoinAddress: (address: string): boolean => {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  },

  isValidEthereumAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  isValidCryptoAddress: (address: string, currency: string): boolean => {
    if (currency === "BTC")
      return addressValidators.isValidBitcoinAddress(address);
    if (currency === "ETH" || currency === "USDT")
      return addressValidators.isValidEthereumAddress(address);
    return false;
  },
};

/**
 * Reset all mocks (call in beforeEach)
 */
export const resetAllMocks = () => {
  Object.values(mockCryptomusAPI).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      (mock as jest.Mock).mockClear();
    }
  });

  Object.values(mockEmailService).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      (mock as jest.Mock).mockClear();
    }
  });

  Object.values(mockBlockchainNetwork).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      (mock as jest.Mock).mockClear();
    }
  });
};
