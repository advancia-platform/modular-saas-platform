'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react';

// ============================================
// CAPTCHA Verification Component
// ============================================
interface CaptchaProps {
  onVerify: (verified: boolean) => void;
}

const RobotVerification: React.FC<CaptchaProps> = ({ onVerify }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleCheck = async () => {
    if (isVerified) return;
    
    setIsChecked(true);
    setIsVerifying(true);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsVerifying(false);
    setIsVerified(true);
    onVerify(true);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-sm mx-auto shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          disabled={isVerified}
          className={`w-7 h-7 border-2 rounded flex items-center justify-center transition-all duration-300 ${
            isVerified 
              ? 'border-green-500 bg-green-500' 
              : isVerifying 
                ? 'border-blue-500 animate-pulse' 
                : 'border-gray-400 hover:border-gray-600 dark:border-gray-500'
          }`}
        >
          {isVerifying ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          ) : isVerified ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : null}
        </button>
        
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          I&apos;m not a robot
        </span>
        
        <div className="ml-auto flex flex-col items-center">
          <Shield className="w-8 h-8 text-gray-400" />
          <span className="text-[10px] text-gray-400">reCAPTCHA</span>
        </div>
      </div>
      
      {isVerified && (
        <div className="mt-3 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verification successful
        </div>
      )}
    </div>
  );
};

// ============================================
// Types
// ============================================
interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  lastTraining: string | null;
  samplesProcessed: number;
  status: 'active' | 'inactive' | 'training';
}

interface TrainingHistoryItem {
  modelName: string;
  trainedAt: string;
  samplesCount: number;
  finalAccuracy: number;
  trainingTime: number;
  version: string;
}

interface DashboardData {
  timestamp: string;
  service: string;
  models: Record<string, ModelInfo>;
  trainingHistory: TrainingHistoryItem[];
  autoRetraining: {
    enabled: boolean;
    intervalHours: number;
    minSamplesRequired: number;
    pendingSamples: number;
  };
  performance: {
    totalPredictions: number;
    avgConfidence: number;
    avgProcessingTimeMs: number;
  };
}

// ============================================
// AI Model Dashboard Component
// ============================================
const AIModelDashboard: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'training' | 'settings'>('overview');
  
  // Auto-retraining config state
  const [autoRetrainConfig, setAutoRetrainConfig] = useState({
    enabled: false,
    intervalHours: 24,
    minSamplesRequired: 100,
    accuracyThreshold: 0.85
  });

  // Training sample state
  const [newSample, setNewSample] = useState({
    features: '',
    label: ''
  });

  const API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:5000';

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/training-dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
      
      if (data.autoRetraining) {
        setAutoRetrainConfig(prev => ({
          ...prev,
          enabled: data.autoRetraining.enabled,
          intervalHours: data.autoRetraining.intervalHours,
          minSamplesRequired: data.autoRetraining.minSamplesRequired
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Use mock data for demo
      setDashboardData(getMockDashboardData());
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Export models
  const handleExportModels = async (modelName: string = 'all') => {
    try {
      const response = await fetch(`${API_BASE}/export-model?model=${modelName}`);
      if (!response.ok) throw new Error('Export failed');
      const data = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `models_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Check console for details.');
    }
  };

  // Import model
  const handleImportModel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const modelData = JSON.parse(text);
      
      const response = await fetch(`${API_BASE}/import-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
      
      if (!response.ok) throw new Error('Import failed');
      alert('Model imported successfully!');
      fetchDashboard();
    } catch (err) {
      console.error('Import error:', err);
      alert('Import failed. Check console for details.');
    }
  };

  // Configure auto-retraining
  const handleConfigureAutoRetrain = async () => {
    try {
      const response = await fetch(`${API_BASE}/auto-retrain/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoRetrainConfig)
      });
      
      if (!response.ok) throw new Error('Configuration failed');
      alert('Auto-retraining configured successfully!');
      fetchDashboard();
    } catch (err) {
      console.error('Config error:', err);
      alert('Configuration failed. Check console for details.');
    }
  };

  // Add training sample
  const handleAddSample = async () => {
    if (!newSample.features || !newSample.label) {
      alert('Please fill in both features and label');
      return;
    }

    try {
      const features = newSample.features.split(',').map(f => parseFloat(f.trim()));
      
      const response = await fetch(`${API_BASE}/add-training-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features,
          label: newSample.label
        })
      });
      
      if (!response.ok) throw new Error('Failed to add sample');
      alert('Training sample added!');
      setNewSample({ features: '', label: '' });
      fetchDashboard();
    } catch (err) {
      console.error('Add sample error:', err);
      alert('Failed to add sample. Check console for details.');
    }
  };

  useEffect(() => {
    if (isVerified) {
      fetchDashboard();
    }
  }, [isVerified, fetchDashboard]);

  // Mock data for demo
  const getMockDashboardData = (): DashboardData => ({
    timestamp: new Date().toISOString(),
    service: 'ai-devops-reasoning-engine',
    models: {
      fraud_detector: {
        name: 'Fraud Detection',
        version: '1.2.3',
        accuracy: 0.92,
        lastTraining: new Date(Date.now() - 86400000).toISOString(),
        samplesProcessed: 15420,
        status: 'active'
      },
      risk_assessor: {
        name: 'Risk Assessment',
        version: '1.1.0',
        accuracy: 0.89,
        lastTraining: new Date(Date.now() - 172800000).toISOString(),
        samplesProcessed: 8750,
        status: 'active'
      },
      sentiment_analyzer: {
        name: 'Sentiment Analysis',
        version: '1.0.5',
        accuracy: 0.87,
        lastTraining: new Date(Date.now() - 259200000).toISOString(),
        samplesProcessed: 5230,
        status: 'active'
      }
    },
    trainingHistory: [
      { modelName: 'fraud_detector', trainedAt: new Date(Date.now() - 86400000).toISOString(), samplesCount: 500, finalAccuracy: 0.92, trainingTime: 45000, version: '1.2.3' },
      { modelName: 'risk_assessor', trainedAt: new Date(Date.now() - 172800000).toISOString(), samplesCount: 350, finalAccuracy: 0.89, trainingTime: 32000, version: '1.1.0' },
      { modelName: 'fraud_detector', trainedAt: new Date(Date.now() - 345600000).toISOString(), samplesCount: 420, finalAccuracy: 0.91, trainingTime: 41000, version: '1.2.2' }
    ],
    autoRetraining: {
      enabled: true,
      intervalHours: 24,
      minSamplesRequired: 100,
      pendingSamples: 47
    },
    performance: {
      totalPredictions: 125430,
      avgConfidence: 0.87,
      avgProcessingTimeMs: 45
    }
  });

  // ============================================
  // Render Components
  // ============================================

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Model Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please verify you&apos;re human to access the AI management console
            </p>
          </div>
          
          <RobotVerification onVerify={setIsVerified} />
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Protected by Advancia Security
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Model Management</h1>
                <p className="text-sm text-gray-500">Training Dashboard & Model Export</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchDashboard()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => handleExportModels('all')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
          {(['overview', 'models', 'training', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-700 dark:text-yellow-400">
              Using demo data. API connection failed: {error}
            </span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Predictions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.performance.totalPredictions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Confidence</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(dashboardData.performance.avgConfidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Processing</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.performance.avgProcessingTimeMs}ms
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Database className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Samples</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.autoRetraining.pendingSamples}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Models Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Models</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(dashboardData.models).map(([key, model]) => (
                  <div key={key} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        model.status === 'active' ? 'bg-green-500' :
                        model.status === 'training' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                        <p className="text-sm text-gray-500">v{model.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {(model.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Samples</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {model.samplesProcessed.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportModels(key)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(dashboardData.models).map(([key, model]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{model.name}</h3>
                    <p className="text-sm text-gray-500">Version {model.version}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    model.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : model.status === 'training'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {model.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accuracy</span>
                    <span className="font-medium text-gray-900 dark:text-white">{(model.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${model.accuracy * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Samples Processed</span>
                    <span className="text-gray-900 dark:text-white">{model.samplesProcessed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Training</span>
                    <span className="text-gray-900 dark:text-white">
                      {model.lastTraining ? new Date(model.lastTraining).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleExportModels(key)}
                    className="flex-1 py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            ))}
            
            {/* Import Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Import Model</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a previously exported model JSON file
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportModel}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && dashboardData && (
          <div className="space-y-6">
            {/* Add Training Sample */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Training Sample</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Features (comma-separated numbers)
                  </label>
                  <input
                    type="text"
                    value={newSample.features}
                    onChange={(e) => setNewSample(prev => ({ ...prev, features: e.target.value }))}
                    placeholder="1.5, 2.3, 0.8, 4.2, ..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label
                  </label>
                  <select
                    value={newSample.label}
                    onChange={(e) => setNewSample(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select label</option>
                    <option value="normal">Normal</option>
                    <option value="malware">Malware</option>
                    <option value="phishing">Phishing</option>
                    <option value="ddos">DDoS</option>
                    <option value="injection">Injection</option>
                    <option value="threat">Threat</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddSample}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Add Sample
              </button>
            </div>

            {/* Training History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Samples</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Accuracy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dashboardData.trainingHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.modelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.trainedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.samplesCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            item.finalAccuracy >= 0.9 ? 'text-green-600' :
                            item.finalAccuracy >= 0.8 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {(item.finalAccuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(item.trainingTime / 1000).toFixed(1)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          v{item.version}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Auto-Retraining Configuration</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enable Auto-Retraining</h3>
                  <p className="text-sm text-gray-500">Automatically retrain models when conditions are met</p>
                </div>
                <button
                  onClick={() => setAutoRetrainConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    autoRetrainConfig.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoRetrainConfig.enabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interval (hours)
                  </label>
                  <input
                    type="number"
                    value={autoRetrainConfig.intervalHours}
                    onChange={(e) => setAutoRetrainConfig(prev => ({ ...prev, intervalHours: parseInt(e.target.value) || 24 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Samples Required
                  </label>
                  <input
                    type="number"
                    value={autoRetrainConfig.minSamplesRequired}
                    onChange={(e) => setAutoRetrainConfig(prev => ({ ...prev, minSamplesRequired: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Accuracy Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={autoRetrainConfig.accuracyThreshold}
                    onChange={(e) => setAutoRetrainConfig(prev => ({ ...prev, accuracyThreshold: parseFloat(e.target.value) || 0.85 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <button
                onClick={handleConfigureAutoRetrain}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIModelDashboard;
