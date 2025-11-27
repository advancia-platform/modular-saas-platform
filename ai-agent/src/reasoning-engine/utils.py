#!/usr/bin/env python3
"""
AI DevOps Agent - Utility Functions
==================================

Utility functions for error validation, logging, and risk calculation.
"""

import os
import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

def setup_logging() -> logging.Logger:
    """Setup structured logging for the reasoning engine."""
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('ai_devops_reasoning.log')
        ]
    )

    logger = logging.getLogger('ai-devops-reasoning')
    logger.info(f"Logging initialized at {log_level} level")

    return logger

def validate_error_payload(payload: Dict) -> Dict[str, Any]:
    """Validate error payload structure and required fields."""
    errors = []
    required_fields = ['error_id', 'message', 'timestamp']

    # Check required fields
    for field in required_fields:
        if field not in payload:
            errors.append(f"Missing required field: {field}")

    # Validate field types
    if 'error_id' in payload and not isinstance(payload['error_id'], str):
        errors.append("error_id must be a string")

    if 'message' in payload and not isinstance(payload['message'], str):
        errors.append("message must be a string")

    if 'timestamp' in payload:
        try:
            datetime.fromisoformat(payload['timestamp'].replace('Z', '+00:00'))
        except ValueError:
            errors.append("timestamp must be a valid ISO format")

    # Validate optional nested structures
    if 'context' in payload and not isinstance(payload['context'], dict):
        errors.append("context must be a dictionary")

    if 'metadata' in payload and not isinstance(payload['metadata'], dict):
        errors.append("metadata must be a dictionary")

    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

class RiskCalculator:
    """Calculate risk and confidence scores using fintech intelligence."""

    def __init__(self):
        self.risk_weights = {
            'fraud_indicators': 0.3,
            'risk_factors': 0.4,
            'sentiment_scores': 0.2,
            'health_metrics': 0.1
        }

    def calculate_confidence(self, fraud_analysis: Dict, risk_analysis: Dict,
                           sentiment_analysis: Dict, health_score: Dict) -> float:
        """Calculate overall confidence score."""

        # Base confidence from individual analyses
        fraud_confidence = fraud_analysis.get('confidence', 0.5)
        risk_confidence = 1.0 - risk_analysis.get('score', 0.5)  # Inverse risk
        sentiment_confidence = sentiment_analysis.get('confidence', 0.5)
        health_confidence = health_score.get('reliability', 0.5)

        # Weighted average
        overall_confidence = (
            fraud_confidence * self.risk_weights['fraud_indicators'] +
            risk_confidence * self.risk_weights['risk_factors'] +
            sentiment_confidence * self.risk_weights['sentiment_scores'] +
            health_confidence * self.risk_weights['health_metrics']
        )

        return round(min(1.0, max(0.0, overall_confidence)), 3)

# Create global instance
risk_calculator = RiskCalculator()

def load_config() -> Dict:
    """Load configuration from environment and config files."""
    config = {
        'openai_api_key': os.getenv('OPENAI_API_KEY'),
        'log_level': os.getenv('LOG_LEVEL', 'INFO'),
        'service_port': int(os.getenv('PYTHON_SERVICE_PORT', 5000)),
        'risk_thresholds': {
            'auto_fix': float(os.getenv('RISK_THRESHOLD_AUTO_FIX', 0.8)),
            'human_review': float(os.getenv('RISK_THRESHOLD_HUMAN_REVIEW', 0.6)),
            'critical_alert': float(os.getenv('RISK_THRESHOLD_CRITICAL_ALERT', 0.9))
        }
    }

    return config
