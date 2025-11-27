// Cash Flow API Service
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface CashFlowDataPoint {
  period: string;
  income: number;
  expenses: number;
  net: number;
  isForecast?: boolean;
}

interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  averageIncome: number;
  averageExpenses: number;
  savingsRate: number;
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface CashFlowResponse {
  success: boolean;
  data: {
    cashFlow: CashFlowDataPoint[];
    summary: CashFlowSummary;
  };
}

interface ForecastResponse {
  success: boolean;
  data: {
    historical: CashFlowDataPoint[];
    forecast: CashFlowDataPoint[];
    method: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

interface CategoryData {
  category: string;
  income: number;
  expenses: number;
  net: number;
  count: number;
}

interface DetailedReportResponse {
  success: boolean;
  data: {
    summary: {
      totalIncome: number;
      totalExpenses: number;
      transactionCount: number;
      dateRange: { start: Date; end: Date };
    };
    categoryBreakdown: CategoryData[];
    topIncomeCategories: Array<{ name: string; amount: number }>;
    topExpenseCategories: Array<{ name: string; amount: number }>;
    monthlyTrends: CashFlowDataPoint[];
    trends: {
      incomeGrowth: number;
      expenseGrowth: number;
    };
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const cashFlowAPI = {
  /**
   * Get cash flow data for a user
   */
  async getCashFlow(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
      category?: string;
    } = {}
  ): Promise<CashFlowResponse> {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);
    if (options.category) params.append('category', options.category);

    const response = await fetch(`${API_URL}/api/cashflow/${userId}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cash flow: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get cash flow forecast
   */
  async getForecast(
    userId: string,
    periods: number = 3,
    period: string = 'monthly'
  ): Promise<ForecastResponse> {
    const params = new URLSearchParams({
      periods: periods.toString(),
      period,
    });

    const response = await fetch(
      `${API_URL}/api/cashflow/${userId}/forecast?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get detailed cash flow report
   */
  async getDetailedReport(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    } = {}
  ): Promise<DetailedReportResponse> {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);

    const response = await fetch(`${API_URL}/api/cashflow/${userId}/report?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Export cash flow to CSV
   */
  async exportToCSV(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);

    const response = await fetch(
      `${API_URL}/api/cashflow/${userId}/export/csv?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Export cash flow to PDF
   */
  async exportToPDF(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);

    const response = await fetch(
      `${API_URL}/api/cashflow/${userId}/export/pdf?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Get categories breakdown
   */
  async getCategories(userId: string): Promise<{ success: boolean; data: CategoryData[] }> {
    const response = await fetch(`${API_URL}/api/cashflow/${userId}/categories`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Download helper for blob data
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
