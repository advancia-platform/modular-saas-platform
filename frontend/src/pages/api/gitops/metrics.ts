import type { NextApiRequest, NextApiResponse } from 'next';

interface PrometheusMetric {
  metric: { [key: string]: string };
  values: [number, string][];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prometheusUrl = process.env.PROMETHEUS_API_URL;
    const prometheusToken = process.env.PROMETHEUS_API_TOKEN;
    const { query } = req.query;

    if (!prometheusUrl) {
      console.warn('Prometheus configuration missing, returning mock data for development');

      // Return mock metrics for development
      const mockMetrics = {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [
            {
              metric: {
                __name__: query || 'up',
                instance: 'ai-agent-frontend:3000',
                job: 'ai-agent-frontend',
              },
              value: [Date.now() / 1000, '1'],
            },
            {
              metric: {
                __name__: query || 'up',
                instance: 'ai-agent-backend:4000',
                job: 'ai-agent-backend',
              },
              value: [Date.now() / 1000, '1'],
            },
          ],
        },
      };

      return res.status(200).json({
        metrics: mockMetrics,
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (prometheusToken) {
      headers['Authorization'] = `Bearer ${prometheusToken}`;
    }

    const response = await fetch(
      `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers,
        timeout: 15000,
      }
    );

    if (!response.ok) {
      throw new Error(`Prometheus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({
      metrics: data,
      timestamp: new Date().toISOString(),
      mock: false,
    });
  } catch (error: any) {
    console.error('Prometheus API error:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
