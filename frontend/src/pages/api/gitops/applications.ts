import type { NextApiRequest, NextApiResponse } from 'next';

interface ArgoCDApplication {
  metadata: {
    name: string;
    namespace: string;
  };
  status: {
    sync: {
      status: 'Synced' | 'OutOfSync' | 'Unknown';
      revision: string;
    };
    health: {
      status: 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended' | 'Missing' | 'Unknown';
    };
  };
  spec: {
    source: {
      repoURL: string;
      targetRevision: string;
      path: string;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const argoCDUrl = process.env.ARGOCD_API_URL;
    const argoCDToken = process.env.ARGOCD_API_TOKEN;

    if (!argoCDUrl || !argoCDToken) {
      console.warn('ArgoCD configuration missing, returning mock data for development');

      // Return mock data for development
      const mockApplications: ArgoCDApplication[] = [
        {
          metadata: {
            name: 'ai-agent-frontend',
            namespace: 'ai-devops',
          },
          status: {
            sync: {
              status: 'Synced',
              revision: 'abc123def456',
            },
            health: {
              status: 'Healthy',
            },
          },
          spec: {
            source: {
              repoURL: 'https://github.com/advancia-platform/modular-saas-platform',
              targetRevision: 'main',
              path: 'frontend-k8s/overlays/prod',
            },
          },
        },
        {
          metadata: {
            name: 'ai-agent-backend',
            namespace: 'ai-devops',
          },
          status: {
            sync: {
              status: 'OutOfSync',
              revision: 'def456ghi789',
            },
            health: {
              status: 'Progressing',
            },
          },
          spec: {
            source: {
              repoURL: 'https://github.com/advancia-platform/modular-saas-platform',
              targetRevision: 'main',
              path: 'backend-k8s/overlays/prod',
            },
          },
        },
      ];

      return res.status(200).json({
        items: mockApplications,
        total: mockApplications.length,
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    const response = await fetch(`${argoCDUrl}/v1/applications`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${argoCDToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`ArgoCD API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter applications to only include relevant ones
    const filteredApplications =
      data.items?.filter(
        (app: ArgoCDApplication) =>
          app.metadata?.name?.includes('ai-agent') || app.metadata?.name?.includes('advancia')
      ) || [];

    res.status(200).json({
      items: filteredApplications,
      total: filteredApplications.length,
      timestamp: new Date().toISOString(),
      mock: false,
    });
  } catch (error: any) {
    console.error('ArgoCD API error:', error);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
