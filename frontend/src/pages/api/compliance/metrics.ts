import { NextApiRequest, NextApiResponse } from 'next';

interface ComplianceMetrics {
  overview: {
    overallComplianceScore: number;
    totalFrameworks: number;
    activeFrameworks: number;
    criticalFindings: number;
    lastAssessment: string;
    nextAssessment: string;
  };
  frameworkScores: {
    framework: string;
    score: number;
    status: 'compliant' | 'non-compliant' | 'partial';
    lastUpdated: string;
    findings: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }[];
  trends: {
    period: string;
    complianceScore: number;
    findingsCount: number;
    timestamp: string;
  }[];
  riskAreas: {
    area: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    lastAssessment: string;
    recommendations: string[];
  }[];
}

const mockMetrics: ComplianceMetrics = {
  overview: {
    overallComplianceScore: 87.3,
    totalFrameworks: 5,
    activeFrameworks: 4,
    criticalFindings: 7,
    lastAssessment: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    nextAssessment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  frameworkScores: [
    {
      framework: 'SOX',
      score: 88.3,
      status: 'partial',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      findings: { critical: 2, high: 5, medium: 8, low: 12 },
    },
    {
      framework: 'PCI-DSS',
      score: 91.6,
      status: 'compliant',
      lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      findings: { critical: 1, high: 3, medium: 5, low: 7 },
    },
    {
      framework: 'SOC2',
      score: 91.0,
      status: 'compliant',
      lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      findings: { critical: 1, high: 4, medium: 6, low: 9 },
    },
    {
      framework: 'ISO27001',
      score: 86.0,
      status: 'partial',
      lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      findings: { critical: 3, high: 6, medium: 8, low: 11 },
    },
    {
      framework: 'GDPR',
      score: 78.5,
      status: 'non-compliant',
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      findings: { critical: 4, high: 8, medium: 12, low: 15 },
    },
  ],
  trends: [
    {
      period: '30 days ago',
      complianceScore: 82.1,
      findingsCount: 67,
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      period: '21 days ago',
      complianceScore: 84.7,
      findingsCount: 58,
      timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      period: '14 days ago',
      complianceScore: 85.9,
      findingsCount: 52,
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      period: '7 days ago',
      complianceScore: 86.2,
      findingsCount: 49,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      period: 'Today',
      complianceScore: 87.3,
      findingsCount: 45,
      timestamp: new Date().toISOString(),
    },
  ],
  riskAreas: [
    {
      area: 'Access Management',
      riskLevel: 'high',
      score: 72.5,
      trend: 'improving',
      lastAssessment: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Implement multi-factor authentication for all admin accounts',
        'Review and update role-based access controls quarterly',
        'Enable privileged access monitoring and alerting',
      ],
    },
    {
      area: 'Data Encryption',
      riskLevel: 'medium',
      score: 89.2,
      trend: 'stable',
      lastAssessment: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Upgrade encryption algorithms to latest standards',
        'Implement key rotation policies',
        'Enable encryption-at-rest for all databases',
      ],
    },
    {
      area: 'Audit Logging',
      riskLevel: 'medium',
      score: 85.7,
      trend: 'improving',
      lastAssessment: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Increase audit log retention period to 2 years',
        'Implement log integrity verification',
        'Enable real-time audit log monitoring',
      ],
    },
    {
      area: 'Vulnerability Management',
      riskLevel: 'critical',
      score: 68.3,
      trend: 'deteriorating',
      lastAssessment: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Establish automated vulnerability scanning',
        'Implement patch management automation',
        'Create vulnerability response playbooks',
        'Conduct monthly vulnerability assessments',
      ],
    },
    {
      area: 'Incident Response',
      riskLevel: 'low',
      score: 92.1,
      trend: 'stable',
      lastAssessment: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Update incident response procedures annually',
        'Conduct tabletop exercises quarterly',
        'Integrate with external threat intelligence feeds',
      ],
    },
  ],
};

async function fetchComplianceMetrics(): Promise<ComplianceMetrics> {
  try {
    // In production, this would fetch from multiple sources:
    // - Prometheus for real-time metrics
    // - Compliance tools for framework scores
    // - Database for historical trends
    // - Risk assessment tools for risk areas

    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

    // Fetch overall compliance score
    const complianceScoreQuery = 'avg(compliance_framework_score)';
    const response = await fetch(
      `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(complianceScoreQuery)}`
    );

    if (response.ok) {
      const data = await response.json();
      const realTimeScore = data.data?.result?.[0]?.value?.[1];

      if (realTimeScore) {
        mockMetrics.overview.overallComplianceScore = parseFloat(realTimeScore);
      }
    }

    // Fetch critical findings count
    const criticalFindingsQuery = 'sum(compliance_findings{severity="critical"})';
    const findingsResponse = await fetch(
      `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(criticalFindingsQuery)}`
    );

    if (findingsResponse.ok) {
      const findingsData = await findingsResponse.json();
      const criticalCount = findingsData.data?.result?.[0]?.value?.[1];

      if (criticalCount) {
        mockMetrics.overview.criticalFindings = parseInt(criticalCount);
      }
    }

    return mockMetrics;
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    return mockMetrics;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComplianceMetrics>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    const useMockData = process.env.NODE_ENV === 'development' || req.query.mock === 'true';

    let metrics: ComplianceMetrics;

    if (useMockData) {
      console.log('Using mock compliance metrics for development');
      metrics = mockMetrics;
    } else {
      metrics = await fetchComplianceMetrics();
    }

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in compliance metrics API:', error);
    res.status(200).json(mockMetrics);
  }
}
