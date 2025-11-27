import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const argoCDUrl = process.env.ARGOCD_API_URL;
    const argoCDToken = process.env.ARGOCD_API_TOKEN;
    const { appName, revision } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'Application name is required' });
    }

    if (!argoCDUrl || !argoCDToken) {
      console.warn('ArgoCD configuration missing, returning mock response for development');

      // Return mock rollback response for development
      return res.status(200).json({
        success: true,
        operation: {
          metadata: {
            name: `${appName}-rollback-${Date.now()}`,
            uid: `mock-rollback-${Date.now()}`,
          },
          status: 'Running',
          message: `Mock rollback initiated for ${appName}`,
        },
        targetRevision: revision || 'previous',
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    // Get current application to find previous revision if not specified
    let targetRevision = revision;
    if (!targetRevision) {
      const appResponse = await fetch(`${argoCDUrl}/v1/applications/${appName}`, {
        headers: {
          Authorization: `Bearer ${argoCDToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (appResponse.ok) {
        const appData = await appResponse.json();
        const history = appData.status?.history || [];

        if (history.length < 2) {
          return res.status(400).json({
            error: 'No previous revision available for rollback',
            currentRevision: history[0]?.revision || 'unknown',
          });
        }

        targetRevision = history[history.length - 2].revision;
      } else {
        return res.status(404).json({
          error: 'Application not found or cannot access application details',
        });
      }
    }

    const rollbackRequest = {
      revision: targetRevision,
      syncOptions: {
        items: ['PruneLast=true'],
      },
    };

    const response = await fetch(`${argoCDUrl}/v1/applications/${appName}/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${argoCDToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rollbackRequest),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`ArgoCD rollback failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      operation: data,
      targetRevision,
      message: `Rollback initiated for application ${appName} to revision ${targetRevision}`,
      timestamp: new Date().toISOString(),
      mock: false,
    });
  } catch (error: any) {
    console.error('Rollback operation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback application',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
