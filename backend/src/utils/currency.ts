import { Prisma } from "@prisma/client";

// Use Prisma.Decimal constructor (Jest-compatible)
const Decimal = Prisma.Decimal;

export type SupportedCurrency = "USD" | "EUR" | "GBP" | "BTC" | "ETH" | "USDT";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimals: number;
  isCrypto: boolean;
  minAmount: Prisma.Decimal;
  maxAmount: Prisma.Decimal;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    isCrypto: false,
  minAmount: new Decimal("0.01"),
  maxAmount: new Decimal("1000000"),
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    isCrypto: false,
  minAmount: new Decimal("0.01"),
  maxAmount: new Decimal("1000000"),
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    isCrypto: false,
    minAmount: new Decimal("0.01"),
    maxAmount: new Decimal("1000000"),
  },
  BTC: {
    code: "BTC",
    symbol: "₿",
    name: "Bitcoin",
    decimals: 8,
    isCrypto: true,
    minAmount: new Decimal("0.00000001"),
    maxAmount: new Decimal("21000000"),
  },
  ETH: {
    code: "ETH",
    symbol: "Ξ",
    name: "Ethereum",
    decimals: 18,
    isCrypto: true,
    minAmount: new Decimal("0.000000000000000001"),
    maxAmount: new Decimal("1000000000"),
  },
  USDT: {
    code: "USDT",
    symbol: "₮",
    name: "Tether USD",
    decimals: 6,
    isCrypto: true,
    minAmount: new Decimal("0.000001"),
    maxAmount: new Decimal("1000000000"),
  },
};

// Format currency amount with proper decimals and symbol
export function formatCurrency(
  amount: Prisma.Decimal | string | number,
  currency: SupportedCurrency,
): string {
  const config = CURRENCIES[currency];
  if (!config) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const decimal = new Decimal(amount);
  const formatted = decimal.toFixed(config.decimals);

  if (config.isCrypto) {
    return `${formatted} ${config.code}`;
  } else {
    return `${config.symbol}${formatted}`;
  }
}

// Parse currency amount string to Decimal
export function parseCurrencyAmount(
  amountStr: string,
  currency: SupportedCurrency,
): Prisma.Decimal {
  const config = CURRENCIES[currency];
  if (!config) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Remove currency symbols and spaces
  const cleanAmount = amountStr
    .replace(config.symbol, "")
    .replace(config.code, "")
    .replace(/\s/g, "")
    .replace(/,/g, "");

  const amount = new Decimal(cleanAmount);

  if (amount.lt(config.minAmount)) {
    throw new Error(
      `Amount ${amount} is below minimum ${config.minAmount} for ${currency}`,
    );
  }

  if (amount.gt(config.maxAmount)) {
    throw new Error(
      `Amount ${amount} exceeds maximum ${config.maxAmount} for ${currency}`,
    );
  }

  return amount;
}

// Convert between currencies (placeholder - would need real exchange rates)
export async function convertCurrency(
  amount: Prisma.Decimal,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
): Promise<Prisma.Decimal> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // This is a simplified conversion - in production you would use real exchange rates
  // from services like CoinGecko, CurrencyAPI, etc.
  const mockRates: Record<string, number> = {
    "USD-EUR": 0.85,
    "EUR-USD": 1.18,
    "USD-GBP": 0.73,
    "GBP-USD": 1.37,
    "BTC-USD": 45000,
    "USD-BTC": 1 / 45000,
    "ETH-USD": 3000,
    "USD-ETH": 1 / 3000,
    "USDT-USD": 1.0,
    "USD-USDT": 1.0,
  };

  const rateKey = `${fromCurrency}-${toCurrency}`;
  const rate = mockRates[rateKey];

  if (!rate) {
    throw new Error(
      `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
    );
  }

  return amount.mul(rate);
}

// Validate currency code
export function isValidCurrency(
  currency: string,
): currency is SupportedCurrency {
  return currency in CURRENCIES;
}

// Get all supported currencies
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

// Get fiat currencies only
export function getFiatCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES).filter((currency) => !currency.isCrypto);
}

// Get crypto currencies only
export function getCryptoCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES).filter((currency) => currency.isCrypto);
}

// Calculate transaction fee
export function calculateTransactionFee(
  amount: Prisma.Decimal,
  currency: SupportedCurrency,
  feePercentage: number = 0.025, // 2.5% default
): Prisma.Decimal {
  const config = CURRENCIES[currency];
  if (!config) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const fee = amount.mul(feePercentage);
  const minFee = config.isCrypto ? new Decimal("0.0001") : new Decimal("0.30");
  const maxFee = config.isCrypto ? new Decimal("0.01") : new Decimal("50.00");

  return Decimal.max(minFee, Decimal.min(fee, maxFee));
}

// Round amount to currency precision
export function roundToCurrencyPrecision(
  amount: Prisma.Decimal,
  currency: SupportedCurrency,
): Prisma.Decimal {
  const config = CURRENCIES[currency];
  if (!config) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return amount.toDecimalPlaces(config.decimals);
}

// Validate amount format
export function validateAmount(
  amount: string | number | Prisma.Decimal,
  currency: SupportedCurrency,
): {
  isValid: boolean;
  error?: string;
  parsedAmount?: Prisma.Decimal;
} {
  try {
    const config = CURRENCIES[currency];
    if (!config) {
      return { isValid: false, error: `Unsupported currency: ${currency}` };
    }

    const decimal = new Decimal(amount);

    if (decimal.isNaN() || !decimal.isFinite()) {
      return { isValid: false, error: "Invalid amount format" };
    }

    if (decimal.lt(0)) {
      return { isValid: false, error: "Amount cannot be negative" };
    }

    if (decimal.lt(config.minAmount)) {
      return {
        isValid: false,
        error: `Amount is below minimum ${formatCurrency(config.minAmount, currency)}`,
      };
    }

    if (decimal.gt(config.maxAmount)) {
      return {
        isValid: false,
        error: `Amount exceeds maximum ${formatCurrency(config.maxAmount, currency)}`,
      };
    }

    const rounded = roundToCurrencyPrecision(decimal, currency);
    return { isValid: true, parsedAmount: rounded };
  } catch (error) {
    return { isValid: false, error: "Invalid amount format" };
  }
}
