// LoadTestDashboard.tsx - Enhanced load testing dashboard component integrated with GitOps
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { Activity, Shield } from 'lucide-react';
import ComplianceMonitoringDashboard from './ComplianceMonitoringDashboard';

interface LoadTestScenario {
  error_id: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  environment: string;
  context: {
    file_path: string;
    environment: string;
  };
  metadata: {
    frequency: string;
    severity: string;
  };
}

interface LoadTestResult {
  scenario_id: string;
  analysis_time: number;
  execution_time: number;
  success: boolean;
  confidence: number;
  risk_score: number;
  deployment_strategy: string;
  error?: string;
}

interface LoadTestStats {
  total_scenarios: number;
  successful_scenarios: number;
  success_rate: number;
  avg_analysis_time: number;
  avg_execution_time: number;
  total_pipeline_time: number;
  requests_per_second: number;
}

interface FinTechMapper {
  name: string;
  status: 'working' | 'error' | 'unknown';
  description: string;
  lastTested: string;
}

export default function LoadTestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [results, setResults] = useState<LoadTestResult[]>([]);
  const [stats, setStats] = useState<LoadTestStats | null>(null);
  const [mappers, setMappers] = useState<FinTechMapper[]>([]);
  const [activeTab, setActiveTab] = useState<'load-testing' | 'compliance'>('load-testing');
  const [testConfig, setTestConfig] = useState({
    concurrent_requests: 5,
    total_requests: 20,
    reasoning_engine_url: 'http://localhost:5000',
    execution_engine_url: 'http://localhost:3000',
  });

  // Predefined test scenarios matching the bash script
  const testScenarios: LoadTestScenario[] = [
    {
      error_id: 'scenario-001',
      message: 'Payment gateway timeout - credit card processing failed',
      severity: 'critical',
      environment: 'production',
      context: {
        file_path: 'src/payment/stripe-processor.js',
        environment: 'production',
      },
      metadata: {
        frequency: 'high',
        severity: 'critical',
      },
    },
    {
      error_id: 'scenario-002',
      message: 'SQL injection vulnerability detected in user authentication',
      severity: 'critical',
      environment: 'production',
      context: {
        file_path: 'src/auth/user-service.js',
        environment: 'production',
      },
      metadata: {
        frequency: 'medium',
        severity: 'critical',
      },
    },
    {
      error_id: 'scenario-003',
      message: 'Database connection pool exhausted - high memory usage',
      severity: 'high',
      environment: 'production',
      context: {
        file_path: 'src/database/connection-pool.js',
        environment: 'production',
      },
      metadata: {
        frequency: 'high',
        severity: 'high',
      },
    },
    {
      error_id: 'scenario-004',
      message: 'Fraud detection algorithm timeout during transaction validation',
      severity: 'high',
      environment: 'production',
      context: {
        file_path: 'src/fraud/detection-engine.js',
        environment: 'production',
      },
      metadata: {
        frequency: 'medium',
        severity: 'high',
      },
    },
    {
      error_id: 'scenario-005',
      message: 'Compliance violation - PII data exposure in logs',
      severity: 'critical',
      environment: 'production',
      context: {
        file_path: 'src/logging/audit-logger.js',
        environment: 'production',
      },
      metadata: {
        frequency: 'low',
        severity: 'critical',
      },
    },
  ];

  // FinTech AI Mappers
  const finTechMappers: FinTechMapper[] = [
    {
      name: 'fraud_detection',
      status: 'unknown',
      description: 'Real-time transaction fraud detection',
      lastTested: '',
    },
    {
      name: 'risk_assessment',
      status: 'unknown',
      description: 'Credit and operational risk scoring',
      lastTested: '',
    },
    {
      name: 'algorithmic_trading',
      status: 'unknown',
      description: 'Automated trading strategy execution',
      lastTested: '',
    },
    {
      name: 'sentiment_analysis',
      status: 'unknown',
      description: 'Market sentiment from news and social media',
      lastTested: '',
    },
    {
      name: 'credit_scoring',
      status: 'unknown',
      description: 'AI-powered credit worthiness assessment',
      lastTested: '',
    },
    {
      name: 'market_analysis',
      status: 'unknown',
      description: 'Technical and fundamental market analysis',
      lastTested: '',
    },
    {
      name: 'payment_processing',
      status: 'unknown',
      description: 'Intelligent payment routing and optimization',
      lastTested: '',
    },
    {
      name: 'compliance_monitoring',
      status: 'unknown',
      description: 'Regulatory compliance automation',
      lastTested: '',
    },
    {
      name: 'customer_analytics',
      status: 'unknown',
      description: 'Customer behavior and lifetime value prediction',
      lastTested: '',
    },
    {
      name: 'aml_detection',
      status: 'unknown',
      description: 'Anti-money laundering pattern detection',
      lastTested: '',
    },
    {
      name: 'regulatory_reporting',
      status: 'unknown',
      description: 'Automated regulatory report generation',
      lastTested: '',
    },
    {
      name: 'portfolio_optimization',
      status: 'unknown',
      description: 'AI-driven portfolio allocation optimization',
      lastTested: '',
    },
  ];

  // Test individual AI mapper
  const testMapper = useCallback(async (mapperName: string) => {
    try {
      const response = await fetch('/api/ai/test-mapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapper: mapperName,
          payload: {
            error_id: `mapper-test-${mapperName}`,
            message: `Comprehensive mapper validation test for ${mapperName}`,
            severity: 'high',
            environment: 'production',
          },
        }),
      });

      if (response.ok) {
        setMappers((prev) =>
          prev.map((m) =>
            m.name === mapperName
              ? { ...m, status: 'working', lastTested: new Date().toLocaleTimeString() }
              : m
          )
        );
      } else {
        setMappers((prev) =>
          prev.map((m) =>
            m.name === mapperName
              ? { ...m, status: 'error', lastTested: new Date().toLocaleTimeString() }
              : m
          )
        );
      }
    } catch (error) {
      logger.error('Mapper test error', { mapper: mapperName, error });
      setMappers((prev) =>
        prev.map((m) =>
          m.name === mapperName
            ? { ...m, status: 'error', lastTested: new Date().toLocaleTimeString() }
            : m
        )
      );
    }
  }, []);

  // Run comprehensive load test
  const runLoadTest = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setStats(null);

    try {
      logger.info('Starting comprehensive AI DevOps load test', { config: testConfig });

      const startTime = Date.now();
      let successCount = 0;
      let totalAnalysisTime = 0;
      let totalExecutionTime = 0;

      // Process each scenario
      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        setCurrentScenario(`Testing Scenario ${i + 1}: ${scenario.message.substring(0, 50)}...`);

        const scenarioStartTime = Date.now();

        try {
          // Analysis phase
          const analysisStart = Date.now();
          const analysisResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scenario),
          });
          const analysisTime = Date.now() - analysisStart;
          totalAnalysisTime += analysisTime;

          if (!analysisResponse.ok) {
            throw new Error(`Analysis failed: ${analysisResponse.status}`);
          }

          const analysisData = await analysisResponse.json();

          // Execution phase
          const executionStart = Date.now();
          const executionResponse = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error_id: scenario.error_id,
              fix_plan: {
                type: 'AUTOMATED_FIX',
                target_files: ['src/automated-fix.js'],
                estimated_time: '5-10 minutes',
                risk_level: 'MEDIUM',
              },
              deployment_strategy: 'canary',
            }),
          });
          const executionTime = Date.now() - executionStart;
          totalExecutionTime += executionTime;

          if (!executionResponse.ok) {
            throw new Error(`Execution failed: ${executionResponse.status}`);
          }

          const executionData = await executionResponse.json();

          // Success case
          successCount++;
          const result: LoadTestResult = {
            scenario_id: scenario.error_id,
            analysis_time: analysisTime,
            execution_time: executionTime,
            success: true,
            confidence: analysisData.confidence || 0.85,
            risk_score: analysisData.risk_score || 0.3,
            deployment_strategy: executionData.deployment_strategy || 'canary',
          };

          setResults((prev) => [...prev, result]);
        } catch (error) {
          // Error case
          const result: LoadTestResult = {
            scenario_id: scenario.error_id,
            analysis_time: 0,
            execution_time: 0,
            success: false,
            confidence: 0,
            risk_score: 1.0,
            deployment_strategy: 'manual',
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          setResults((prev) => [...prev, result]);
          logger.error('Scenario test failed', { scenario: scenario.error_id, error });
        }
      }

      // Calculate final statistics
      const totalTime = Date.now() - startTime;
      const avgAnalysisTime = totalAnalysisTime / testScenarios.length;
      const avgExecutionTime = totalExecutionTime / testScenarios.length;
      const successRate = (successCount / testScenarios.length) * 100;

      const finalStats: LoadTestStats = {
        total_scenarios: testScenarios.length,
        successful_scenarios: successCount,
        success_rate: successRate,
        avg_analysis_time: avgAnalysisTime,
        avg_execution_time: avgExecutionTime,
        total_pipeline_time: totalTime,
        requests_per_second: (testScenarios.length * 1000) / totalTime,
      };

      setStats(finalStats);
      setCurrentScenario(null);

      // Show completion notification
      if (successRate >= 90) {
        toast.success(`🎉 Load test completed! ${successRate.toFixed(1)}% success rate`);
      } else if (successRate >= 70) {
        toast.success(`⚡ Load test completed with ${successRate.toFixed(1)}% success rate`);
      } else {
        toast.error(`⚠️ Load test completed with issues: ${successRate.toFixed(1)}% success rate`);
      }

      logger.info('Load test completed', { stats: finalStats });
    } catch (error) {
      logger.error('Load test failed', { error });
      toast.error(
        'Load test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsRunning(false);
    }
  }, [testConfig, testScenarios]);

  // Test all mappers
  const testAllMappers = useCallback(async () => {
    toast.info('Testing all FinTech AI mappers...');

    for (const mapper of finTechMappers) {
      await testMapper(mapper.name);
      // Small delay to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    toast.success('Mapper testing completed');
  }, [testMapper]);

  // Initialize mappers
  useEffect(() => {
    setMappers(finTechMappers);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚡';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 AI DevOps Agent - Load Testing Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive testing of AI pipeline with real-world fintech scenarios
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('load-testing')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'load-testing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Load Testing
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'compliance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Compliance Monitoring
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'load-testing' && (
          <>
            {/* Configuration Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">🔧 Test Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concurrent Requests
                  </label>
                  <input
                    type="number"
                    value={testConfig.concurrent_requests}
                    onChange={(e) =>
                      setTestConfig((prev) => ({
                        ...prev,
                        concurrent_requests: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Requests
                  </label>
                  <input
                    type="number"
                    value={testConfig.total_requests}
                    onChange={(e) =>
                      setTestConfig((prev) => ({
                        ...prev,
                        total_requests: parseInt(e.target.value) || 20,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reasoning Engine URL
                  </label>
                  <input
                    type="url"
                    value={testConfig.reasoning_engine_url}
                    onChange={(e) =>
                      setTestConfig((prev) => ({
                        ...prev,
                        reasoning_engine_url: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Execution Engine URL
                  </label>
                  <input
                    type="url"
                    value={testConfig.execution_engine_url}
                    onChange={(e) =>
                      setTestConfig((prev) => ({
                        ...prev,
                        execution_engine_url: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">🚀 Test Controls</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={testAllMappers}
                    disabled={isRunning}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    🧠 Test All Mappers
                  </button>
                  <button
                    onClick={runLoadTest}
                    disabled={isRunning}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Running...
                      </>
                    ) : (
                      '🔥 Start Load Test'
                    )}
                  </button>
                </div>
              </div>

              {currentScenario && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">🔍 {currentScenario}</p>
                </div>
              )}
            </div>

            {/* Statistics Panel */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">📊 Performance Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.success_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.avg_analysis_time.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-blue-600">Avg Analysis Time</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.avg_execution_time.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-purple-600">Avg Execution Time</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.requests_per_second.toFixed(1)}
                    </div>
                    <div className="text-sm text-indigo-600">Requests/Second</div>
                  </div>
                </div>
              </div>
            )}

            {/* FinTech AI Mappers Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">🧠 FinTech AI Mappers Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappers.map((mapper) => (
                  <div
                    key={mapper.name}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {mapper.name.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mapper.status)}`}
                      >
                        {getStatusIcon(mapper.status)} {mapper.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{mapper.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {mapper.lastTested || 'Not tested'}
                      </span>
                      <button
                        onClick={() => testMapper(mapper.name)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Results */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">📋 Scenario Test Results</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Scenario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Analysis Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Execution Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Strategy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={result.scenario_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.scenario_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.success
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result.success ? '✅ Success' : '❌ Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.analysis_time}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.execution_time}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(result.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.deployment_strategy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Compliance Monitoring Tab */}
        {activeTab === 'compliance' && <ComplianceMonitoringDashboard />}
      </div>
    </div>
  );
}
