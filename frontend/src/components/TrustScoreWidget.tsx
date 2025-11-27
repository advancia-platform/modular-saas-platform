'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface TrustScore {
  overall: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  transactionHistory: number;
  accountAge: number;
  verificationLevel: number;
  communityRating: number;
  fraudIndicators: string[];
}

export default function TrustScoreWidget() {
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustScore();
  }, []);

  const fetchTrustScore = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/trust/score', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrustScore(data.trustScore);
      }
    } catch (error) {
      toast.error('Failed to load trust score');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (!trustScore) {
    return null;
  }

  const getRiskColor = () => {
    switch (trustScore.riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Your Trust Score</h3>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-4xl font-bold">{trustScore.overall}/100</div>
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRiskColor()}`}
          >
            {trustScore.riskLevel.toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Similar to</div>
          <div className="font-semibold text-blue-600">Trustpilot Score</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <ScoreBar label="Transactions" score={trustScore.transactionHistory} max={25} />
        <ScoreBar label="Account Age" score={trustScore.accountAge} max={25} />
        <ScoreBar label="Verification" score={trustScore.verificationLevel} max={25} />
        <ScoreBar label="Community" score={trustScore.communityRating} max={25} />
      </div>

      {trustScore.fraudIndicators.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="font-semibold text-yellow-800 mb-1">⚠️ Attention Needed</div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {trustScore.fraudIndicators.map((indicator, idx) => (
              <li key={idx}>• {indicator}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = (score / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
