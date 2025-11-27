import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const services = [
    {
      name: 'argocd',
      url: process.env.ARGOCD_API_URL,
      healthPath: '/version',
      token: process.env.ARGOCD_API_TOKEN,
    },
    {
      name: 'prometheus',
      url: process.env.PROMETHEUS_API_URL,
      healthPath: '/api/v1/status/config',
      token: process.env.PROMETHEUS_API_TOKEN,
    },
    {
      name: 'grafana',
      url: process.env.GRAFANA_API_URL,
      healthPath: '/api/health',
      token: process.env.GRAFANA_API_TOKEN,
    },
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      const startTime = Date.now();

      try {
        if (!service.url) {
          return {
            service: service.name,
            status: 'unhealthy' as const,
            error: 'Service URL not configured',
          };
        }

        const headers: { [key: string]: string } = {
          'Content-Type': 'application/json',
        };

        if (service.token) {
          headers['Authorization'] = `Bearer ${service.token}`;
        }

        const response = await fetch(`${service.url}${service.healthPath}`, {
          method: 'GET',
          headers,
          timeout: 5000,
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            service: service.name,
            status: 'healthy' as const,
            responseTime,
          };
        } else {
          return {
            service: service.name,
            status: 'unhealthy' as const,
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        return {
          service: service.name,
          status: 'unhealthy' as const,
          responseTime,
          error: error.message || 'Connection failed',
        };
      }
    })
  );

  const healthStatuses: HealthStatus[] = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: services[index].name,
        status: 'unhealthy',
        error: 'Health check failed',
      };
    }
  });

  // Determine overall health
  const healthyCount = healthStatuses.filter((h) => h.status === 'healthy').length;
  const totalCount = healthStatuses.length;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    overallStatus = 'healthy';
  } else if (healthyCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  res.status(200).json({
    status: overallStatus,
    services: healthStatuses,
    summary: {
      healthy: healthyCount,
      total: totalCount,
      percentage: Math.round((healthyCount / totalCount) * 100),
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
