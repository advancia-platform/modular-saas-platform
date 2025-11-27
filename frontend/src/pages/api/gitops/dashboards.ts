import type { NextApiRequest, NextApiResponse } from 'next';

interface GrafanaDashboard {
  id: number;
  uid: string;
  title: string;
  url: string;
  tags: string[];
  isStarred: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const grafanaUrl = process.env.GRAFANA_API_URL;
    const grafanaToken = process.env.GRAFANA_API_TOKEN;

    if (!grafanaUrl) {
      console.warn('Grafana configuration missing, returning mock data for development');

      // Return mock dashboards for development
      const mockDashboards: GrafanaDashboard[] = [
        {
          id: 1,
          uid: 'ai-agent-overview',
          title: 'AI Agent Overview',
          url: '/d/ai-agent-overview/ai-agent-overview',
          tags: ['ai-agent', 'overview'],
          isStarred: true,
        },
        {
          id: 2,
          uid: 'frontend-metrics',
          title: 'Frontend Metrics',
          url: '/d/frontend-metrics/frontend-metrics',
          tags: ['ai-agent', 'frontend'],
          isStarred: false,
        },
        {
          id: 3,
          uid: 'backend-metrics',
          title: 'Backend Metrics',
          url: '/d/backend-metrics/backend-metrics',
          tags: ['ai-agent', 'backend'],
          isStarred: false,
        },
        {
          id: 4,
          uid: 'kubernetes-cluster',
          title: 'Kubernetes Cluster',
          url: '/d/kubernetes-cluster/kubernetes-cluster',
          tags: ['kubernetes', 'infrastructure'],
          isStarred: true,
        },
      ];

      return res.status(200).json({
        dashboards: mockDashboards,
        total: mockDashboards.length,
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (grafanaToken) {
      headers['Authorization'] = `Bearer ${grafanaToken}`;
    }

    const response = await fetch(`${grafanaUrl}/api/search?type=dash-db&tag=ai-agent&limit=50`, {
      method: 'GET',
      headers,
      timeout: 15000,
    });

    if (!response.ok) {
      // If Grafana is not available, return empty array instead of error
      if (response.status === 401 || response.status === 403) {
        console.warn('Grafana authentication failed, returning empty dashboards');
        return res.status(200).json({
          dashboards: [],
          total: 0,
          timestamp: new Date().toISOString(),
          mock: false,
          warning: 'Grafana authentication failed',
        });
      }

      throw new Error(`Grafana API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const dashboards: GrafanaDashboard[] = data
      .filter(
        (dashboard: any) =>
          dashboard.title.toLowerCase().includes('ai-agent') ||
          dashboard.title.toLowerCase().includes('frontend') ||
          dashboard.tags?.some((tag: string) => tag.includes('ai-agent'))
      )
      .map((dashboard: any) => ({
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        url: dashboard.url,
        tags: dashboard.tags || [],
        isStarred: dashboard.isStarred || false,
      }));

    res.status(200).json({
      dashboards,
      total: dashboards.length,
      timestamp: new Date().toISOString(),
      mock: false,
    });
  } catch (error: any) {
    console.error('Grafana API error:', error);

    // Return empty dashboards instead of error for better UX
    res.status(200).json({
      dashboards: [],
      total: 0,
      timestamp: new Date().toISOString(),
      mock: false,
      error: error.message,
    });
  }
}
