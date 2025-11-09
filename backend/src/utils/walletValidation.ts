const WAValidator = require("wallet-address-validator");

/**
 * Validate cryptocurrency wallet addresses using wallet-address-validator
 */

export function validateBTCAddress(address: string): boolean {
  try {
    return WAValidator.validate(address, "BTC");
  } catch (error) {
    return false;
  }
}

export function validateETHAddress(address: string): boolean {
  try {
    return WAValidator.validate(address, "ETH");
  } catch (error) {
    return false;
  }
}

export function validateUSDTAddress(address: string): boolean {
  // USDT uses ERC-20 (Ethereum addresses)
  return validateETHAddress(address);
}

export function validateLTCAddress(address: string): boolean {
  try {
    return WAValidator.validate(address, "LTC");
  } catch (error) {
    return false;
  }
}

export function validateCryptoAddress(
  address: string,
  cryptoType: string
): { valid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { valid: false, error: "Address is required" };
  }

  const trimmedAddress = address.trim();

  switch (cryptoType.toUpperCase()) {
    case "BTC":
      if (!validateBTCAddress(trimmedAddress)) {
        return {
          valid: false,
          error: "Invalid Bitcoin address. Must be a valid mainnet address (bc1... or 1... or 3...)",
        };
      }
      break;

    case "ETH":
      if (!validateETHAddress(trimmedAddress)) {
        return {
          valid: false,
          error: "Invalid Ethereum address. Must be a valid 0x... address",
        };
      }
      break;

    case "USDT":
      if (!validateUSDTAddress(trimmedAddress)) {
        return {
          valid: false,
          error: "Invalid USDT address. Must be a valid ERC-20 (Ethereum) address",
        };
      }
      break;

    case "LTC":
      if (!validateLTCAddress(trimmedAddress)) {
        return {
          valid: false,
          error: "Invalid Litecoin address. Must be a valid LTC address",
        };
      }
      break;

    default:
      return {
        valid: false,
        error: `Unsupported cryptocurrency type: ${cryptoType}`,
      };
  }

  return { valid: true };
}

export function getAddressFormat(cryptoType: string): string {
  switch (cryptoType.toUpperCase()) {
    case "BTC":
      return "Bitcoin address (bc1q... or 1... or 3...)";
    case "ETH":
      return "Ethereum address (0x...)";
    case "USDT":
      return "ERC-20 address (0x...)";
    case "LTC":
      return "Litecoin address (ltc1... or L... or M...)";
    default:
      return "Cryptocurrency address";
  }
}
