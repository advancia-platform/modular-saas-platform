import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const argoCDUrl = process.env.ARGOCD_API_URL;
    const argoCDToken = process.env.ARGOCD_API_TOKEN;
    const { appName, dryRun = false, prune = false, force = false } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'Application name is required' });
    }

    if (!argoCDUrl || !argoCDToken) {
      console.warn('ArgoCD configuration missing, returning mock response for development');

      // Return mock sync response for development
      return res.status(200).json({
        success: true,
        operation: {
          metadata: {
            name: `${appName}-sync-${Date.now()}`,
            uid: `mock-${Date.now()}`,
          },
          status: 'Running',
          message: `Mock sync initiated for ${appName}`,
        },
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    const syncRequest = {
      revision: 'HEAD',
      dryRun,
      syncOptions: {
        items: prune ? ['PruneLast=true'] : [],
        force,
      },
    };

    const response = await fetch(`${argoCDUrl}/v1/applications/${appName}/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${argoCDToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncRequest),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`ArgoCD sync failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      operation: data,
      message: `Sync initiated for application ${appName}`,
      timestamp: new Date().toISOString(),
      mock: false,
    });
  } catch (error: any) {
    console.error('Sync operation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync application',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
