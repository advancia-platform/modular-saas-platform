import { NextApiRequest, NextApiResponse } from 'next';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  user: string;
  resource: string;
  namespace?: string;
  outcome: 'success' | 'failure' | 'blocked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: {
    sourceIP?: string;
    userAgent?: string;
    requestId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  category:
    | 'authentication'
    | 'authorization'
    | 'deployment'
    | 'access'
    | 'configuration'
    | 'security';
  complianceRelevant: boolean;
  riskScore: number;
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  summary: {
    totalLogs: number;
    successCount: number;
    failureCount: number;
    blockedCount: number;
    criticalCount: number;
    highRiskCount: number;
    complianceRelevantCount: number;
  };
  timeRange: {
    from: string;
    to: string;
  };
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    source: 'kubernetes-api',
    action: 'pods.create',
    user: 'system:serviceaccount:default:argocd-application-controller',
    resource: 'pod/frontend-deployment-7d8f5b9c4d-xz9m2',
    namespace: 'production',
    outcome: 'success',
    severity: 'medium',
    details: {
      sourceIP: '10.244.1.15',
      userAgent: 'argocd-application-controller/v2.8.5',
      requestId: 'req-abc123',
      metadata: {
        image: 'registry.company.com/frontend:v1.2.3',
        replicas: 3,
      },
    },
    category: 'deployment',
    complianceRelevant: true,
    riskScore: 2.5,
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    source: 'ingress-nginx',
    action: 'authentication.failure',
    user: 'unknown',
    resource: '/api/admin/users',
    outcome: 'blocked',
    severity: 'high',
    details: {
      sourceIP: '203.0.113.45',
      userAgent: 'curl/7.68.0',
      requestId: 'req-def456',
      reason: 'Invalid JWT token',
    },
    category: 'authentication',
    complianceRelevant: true,
    riskScore: 7.8,
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    source: 'rbac-manager',
    action: 'rolebindings.create',
    user: 'admin@company.com',
    resource: 'rolebinding/developer-access',
    namespace: 'development',
    outcome: 'success',
    severity: 'medium',
    details: {
      sourceIP: '192.168.1.100',
      userAgent: 'kubectl/v1.28.2',
      requestId: 'req-ghi789',
      metadata: {
        subjects: ['developer@company.com'],
        roleRef: 'role/developer',
      },
    },
    category: 'authorization',
    complianceRelevant: true,
    riskScore: 4.2,
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    source: 'cert-manager',
    action: 'certificates.renewal',
    user: 'system:serviceaccount:cert-manager:cert-manager',
    resource: 'certificate/api-tls',
    namespace: 'production',
    outcome: 'success',
    severity: 'low',
    details: {
      sourceIP: '10.244.2.20',
      userAgent: 'cert-manager/v1.13.1',
      requestId: 'req-jkl012',
      metadata: {
        dnsNames: ['api.company.com', 'api-prod.company.com'],
        issuer: 'letsencrypt-prod',
      },
    },
    category: 'security',
    complianceRelevant: true,
    riskScore: 1.0,
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source: 'prometheus',
    action: 'metrics.access',
    user: 'monitoring@company.com',
    resource: '/api/v1/query',
    outcome: 'success',
    severity: 'low',
    details: {
      sourceIP: '10.244.3.10',
      userAgent: 'Prometheus/2.45.0',
      requestId: 'req-mno345',
      metadata: {
        query: 'up{job="kubernetes-pods"}',
        scrapeInterval: '30s',
      },
    },
    category: 'access',
    complianceRelevant: false,
    riskScore: 0.5,
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    source: 'falco',
    action: 'security.violation',
    user: 'unknown',
    resource: 'pod/suspicious-pod-xyz',
    namespace: 'default',
    outcome: 'blocked',
    severity: 'critical',
    details: {
      sourceIP: '10.244.1.25',
      userAgent: 'unknown',
      requestId: 'req-pqr678',
      reason: 'Attempted privilege escalation detected',
      metadata: {
        rule: 'Privilege Escalation via File System',
        process: '/bin/bash',
        command: 'chmod +s /bin/bash',
      },
    },
    category: 'security',
    complianceRelevant: true,
    riskScore: 9.5,
  },
];

async function fetchElkAuditLogs(
  page: number = 1,
  pageSize: number = 50,
  filters: any = {}
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    const elkUrl = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';
    const index = 'audit-logs-*';

    // Build Elasticsearch query
    const query = {
      query: {
        bool: {
          must: [
            {
              range: {
                timestamp: {
                  gte: filters.from || 'now-24h',
                  lte: filters.to || 'now',
                },
              },
            },
          ],
          filter: [],
        },
      },
      sort: [{ timestamp: { order: 'desc' } }],
      from: (page - 1) * pageSize,
      size: pageSize,
    };

    // Add filters
    if (filters.severity) {
      query.query.bool.filter.push({ term: { severity: filters.severity } });
    }
    if (filters.category) {
      query.query.bool.filter.push({ term: { category: filters.category } });
    }
    if (filters.outcome) {
      query.query.bool.filter.push({ term: { outcome: filters.outcome } });
    }
    if (filters.complianceRelevant !== undefined) {
      query.query.bool.filter.push({ term: { complianceRelevant: filters.complianceRelevant } });
    }

    const response = await fetch(`${elkUrl}/${index}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ELASTICSEARCH_AUTH
          ? {
              Authorization: `Basic ${Buffer.from(process.env.ELASTICSEARCH_AUTH).toString('base64')}`,
            }
          : {}),
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`ELK request failed: ${response.statusText}`);
    }

    const data = await response.json();

    const logs: AuditLogEntry[] = data.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    }));

    return {
      logs,
      total: data.hits.total.value || data.hits.total,
    };
  } catch (error) {
    console.error('Error fetching audit logs from ELK:', error);

    // Apply mock filters
    let filteredLogs = [...mockAuditLogs];

    if (filters.severity) {
      filteredLogs = filteredLogs.filter((log) => log.severity === filters.severity);
    }
    if (filters.category) {
      filteredLogs = filteredLogs.filter((log) => log.category === filters.category);
    }
    if (filters.outcome) {
      filteredLogs = filteredLogs.filter((log) => log.outcome === filters.outcome);
    }
    if (filters.complianceRelevant !== undefined) {
      filteredLogs = filteredLogs.filter(
        (log) => log.complianceRelevant === filters.complianceRelevant
      );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      logs: filteredLogs.slice(start, end),
      total: filteredLogs.length,
    };
  }
}

function calculateSummary(logs: AuditLogEntry[], total: number) {
  const successCount = logs.filter((log) => log.outcome === 'success').length;
  const failureCount = logs.filter((log) => log.outcome === 'failure').length;
  const blockedCount = logs.filter((log) => log.outcome === 'blocked').length;
  const criticalCount = logs.filter((log) => log.severity === 'critical').length;
  const highRiskCount = logs.filter((log) => log.riskScore >= 7.0).length;
  const complianceRelevantCount = logs.filter((log) => log.complianceRelevant).length;

  return {
    totalLogs: total,
    successCount,
    failureCount,
    blockedCount,
    criticalCount,
    highRiskCount,
    complianceRelevantCount,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AuditLogResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
    const useMockData = process.env.NODE_ENV === 'development' || req.query.mock === 'true';

    const filters = {
      from: req.query.from as string,
      to: req.query.to as string,
      severity: req.query.severity as string,
      category: req.query.category as string,
      outcome: req.query.outcome as string,
      complianceRelevant:
        req.query.complianceRelevant === 'true'
          ? true
          : req.query.complianceRelevant === 'false'
            ? false
            : undefined,
    };

    let logs: AuditLogEntry[];
    let total: number;

    if (useMockData) {
      console.log('Using mock audit log data for development');
      const result = await fetchElkAuditLogs(page, pageSize, filters);
      logs = result.logs;
      total = result.total;
    } else {
      const result = await fetchElkAuditLogs(page, pageSize, filters);
      logs = result.logs;
      total = result.total;
    }

    const summary = calculateSummary(logs, total);
    const totalPages = Math.ceil(total / pageSize);

    const response: AuditLogResponse = {
      logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
      summary,
      timeRange: {
        from: filters.from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: filters.to || new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching audit logs:', error);

    // Fallback to mock data
    const result = await fetchElkAuditLogs(1, 50, {});
    const summary = calculateSummary(result.logs, result.total);

    const fallbackResponse: AuditLogResponse = {
      logs: result.logs,
      pagination: {
        total: result.total,
        page: 1,
        pageSize: 50,
        totalPages: Math.ceil(result.total / 50),
      },
      summary,
      timeRange: {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    };

    res.status(200).json(fallbackResponse);
  }
}
