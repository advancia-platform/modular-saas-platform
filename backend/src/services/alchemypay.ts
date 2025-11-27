import axios from 'axios';
import logger from '../logger';

const API_BASE = process.env.ALCHEMY_PAY_API_URL || 'https://api.alchemypay.io/v1';
const API_KEY = process.env.ALCHEMY_PAY_API_KEY;

interface AlchemyPayoutRequest {
  address: string;
  amount: number;
  currency: string;
  network?: string;
  memo?: string;
}

interface AlchemyPayoutResponse {
  id: string;
  status: string;
  txHash?: string;
  message?: string;
}

export async function createAlchemyPayout(
  amount: number,
  currency: string,
  address: string,
  network?: string,
): Promise<AlchemyPayoutResponse> {
  if (!API_KEY) {
    throw new Error('ALCHEMY_PAY_API_KEY is not configured');
  }

  try {
    const payload: AlchemyPayoutRequest = {
      address,
      amount,
      currency: currency.toUpperCase(),
      network,
    };

    logger.info('Creating Alchemy Pay payout', { currency, amount, address });

    const response = await axios.post(`${API_BASE}/payout`, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info('Alchemy Pay payout created successfully', {
      payoutId: response.data.id,
      status: response.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Alchemy Pay payout failed', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw new Error(
      `Alchemy Pay payout failed: ${error.response?.data?.message || error.message}`,
    );
  }
}

export async function getAlchemyPayoutStatus(payoutId: string): Promise<AlchemyPayoutResponse> {
  if (!API_KEY) {
    throw new Error('ALCHEMY_PAY_API_KEY is not configured');
  }

  try {
    const response = await axios.get(`${API_BASE}/payout/${payoutId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch Alchemy Pay payout status', {
      payoutId,
      error: error.message,
    });

    throw new Error(`Failed to fetch payout status: ${error.message}`);
  }
}

export async function createAlchemyPayment(
  amount: number,
  currency: string,
  fiatCurrency: string = 'USD',
): Promise<any> {
  if (!API_KEY) {
    throw new Error('ALCHEMY_PAY_API_KEY is not configured');
  }

  try {
    const payload = {
      cryptoAmount: amount,
      cryptoCurrency: currency.toUpperCase(),
      fiatCurrency: fiatCurrency.toUpperCase(),
      type: 'BUY',
    };

    logger.info('Creating Alchemy Pay payment', payload);

    const response = await axios.post(`${API_BASE}/payment`, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info('Alchemy Pay payment created', { paymentId: response.data.id });

    return response.data;
  } catch (error: any) {
    logger.error('Alchemy Pay payment failed', {
      error: error.message,
      response: error.response?.data,
    });

    throw new Error(
      `Alchemy Pay payment failed: ${error.response?.data?.message || error.message}`,
    );
  }
}
