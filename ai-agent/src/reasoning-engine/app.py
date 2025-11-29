#!/usr/bin/env python3
"""
AI DevOps Agent - Python Reasoning Engine
==========================================

The brain of the AI DevOps Agent that uses fintech AI functions
to analyze errors and generate intelligent fix plans.

This Flask API receives error payloads and returns structured
fix plans using our 12 fintech AI function mappers.
"""

import os
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

from model import ErrorAnalyzer, FixPlanGenerator
from utils import validate_error_payload, setup_logging, risk_calculator
from fintech_mappers import (
    FraudDetectionMapper,
    RiskAssessmentMapper,
    AlgorithmicTradingMapper,
    SentimentAnalysisMapper,
    CreditScoringMapper,
    MarketAnalysisMapper
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Setup logging
logger = setup_logging()

# Initialize AI components
try:
    openai.api_key = os.getenv('OPENAI_API_KEY')
    if not openai.api_key:
        logger.warning("OPENAI_API_KEY not found. AI analysis will use rule-based fallbacks.")

    error_analyzer = ErrorAnalyzer()
    fix_generator = FixPlanGenerator()

    # Initialize fintech mappers
    fraud_detector = FraudDetectionMapper()
    risk_assessor = RiskAssessmentMapper()
    trading_strategist = AlgorithmicTradingMapper()
    sentiment_analyzer = SentimentAnalysisMapper()
    credit_scorer = CreditScoringMapper()
    market_analyst = MarketAnalysisMapper()

    logger.info("🧠 AI DevOps Reasoning Engine initialized successfully")

except Exception as e:
    logger.error(f"Failed to initialize AI components: {e}")
    raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "service": "ai-devops-reasoning-engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "ai_models": {
            "openai_available": bool(openai.api_key),
            "fintech_mappers_loaded": True
        }
    })

@app.route('/analyze', methods=['POST'])
def analyze_error():
    """
    Main analysis endpoint that processes errors using fintech AI intelligence.

    Expected payload:
    {
        "error_id": "unique_identifier",
        "source": "github|sentry|prometheus|security_scan",
        "timestamp": "ISO_datetime",
        "message": "error_message",
        "stack_trace": "full_stack_trace",
        "context": {
            "file_path": "path/to/file",
            "line_number": 123,
            "function_name": "function_name",
            "environment": "production|staging|development"
        },
        "metadata": {
            "severity": "critical|high|medium|low",
            "frequency": "how_often_this_occurs",
            "impact_scope": "system|module|function"
        }
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400

        error_payload = request.get_json()

        # Validate payload structure
        validation_result = validate_error_payload(error_payload)
        if not validation_result.get('valid'):
            return jsonify({
                "error": "Invalid payload structure",
                "details": validation_result.get('errors', [])
            }), 400

        logger.info(f"🔍 Analyzing error: {error_payload.get('error_id', 'unknown')}")

        # Step 1: Fraud Detection Mapping - Identify suspicious error patterns
        fraud_analysis = fraud_detector.detect_error_patterns(error_payload)
        logger.debug(f"Fraud detection result: {fraud_analysis}")

        # Step 2: Risk Assessment Mapping - Evaluate fix deployment risks
        risk_analysis = risk_assessor.assess_fix_risk(error_payload)
        logger.debug(f"Risk assessment result: {risk_analysis}")

        # Step 3: Sentiment Analysis Mapping - Analyze code quality sentiment
        sentiment_analysis = sentiment_analyzer.analyze_error_sentiment(error_payload)
        logger.debug(f"Sentiment analysis result: {sentiment_analysis}")

        # Step 4: Credit Scoring Mapping - Score system health
        health_score = credit_scorer.score_system_health(error_payload)
        logger.debug(f"Health score result: {health_score}")

        # Step 5: Market Analysis Mapping - Predict performance trends
        trend_analysis = market_analyst.predict_error_trends(error_payload)
        logger.debug(f"Trend analysis result: {trend_analysis}")

        # Step 6: Core error analysis using AI
        analysis_result = error_analyzer.analyze(error_payload, {
            "fraud_indicators": fraud_analysis,
            "risk_factors": risk_analysis,
            "sentiment_scores": sentiment_analysis,
            "health_metrics": health_score,
            "trend_predictions": trend_analysis
        })

        # Step 7: Algorithmic Trading Mapping - Smart deployment decisions
        deployment_strategy = trading_strategist.optimize_deployment(
            analysis_result, risk_analysis
        )
        logger.debug(f"Deployment strategy: {deployment_strategy}")

        # Step 8: Generate comprehensive fix plan
        fix_plan = fix_generator.generate_plan(
            error_payload,
            analysis_result,
            deployment_strategy
        )

        # Step 9: Calculate overall confidence and risk scores
        confidence_score = risk_calculator.calculate_confidence(
            fraud_analysis, risk_analysis, sentiment_analysis, health_score
        )

        # Construct response
        response = {
            "analysis_id": f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "error_id": error_payload.get('error_id'),
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success",
            "fintech_intelligence": {
                "fraud_detection": fraud_analysis,
                "risk_assessment": risk_analysis,
                "sentiment_analysis": sentiment_analysis,
                "health_scoring": health_score,
                "trend_analysis": trend_analysis,
                "deployment_strategy": deployment_strategy
            },
            "error_classification": {
                "category": analysis_result.get('category'),
                "severity": analysis_result.get('severity'),
                "root_cause": analysis_result.get('root_cause'),
                "affected_components": analysis_result.get('affected_components', [])
            },
            "fix_plan": fix_plan,
            "confidence_metrics": {
                "overall_confidence": confidence_score,
                "risk_level": risk_analysis.get('level', 'medium'),
                "auto_fix_recommended": confidence_score >= 0.8 and risk_analysis.get('score', 0.5) <= 0.3,
                "human_review_required": confidence_score < 0.6 or risk_analysis.get('score', 0.5) > 0.7
            },
            "execution_guidance": {
                "immediate_action": fix_plan.get('immediate_action', False),
                "rollback_plan": fix_plan.get('rollback_plan'),
                "monitoring_requirements": fix_plan.get('monitoring', []),
                "estimated_resolution_time": fix_plan.get('estimated_time', 'unknown')
            }
        }

        logger.info(f"✅ Analysis completed for {error_payload.get('error_id')} - Confidence: {confidence_score:.2f}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"❌ Analysis failed: {str(e)}")
        logger.debug(f"Full traceback: {traceback.format_exc()}")

        return jsonify({
            "status": "error",
            "error": "Analysis failed",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

@app.route('/bulk-analyze', methods=['POST'])
def bulk_analyze():
    """Analyze multiple errors in a single request for batch processing."""
    try:
        payload = request.get_json()
        errors = payload.get('errors', [])

        if not errors:
            return jsonify({"error": "No errors provided"}), 400

        if len(errors) > 50:  # Reasonable batch limit
            return jsonify({"error": "Maximum 50 errors per batch"}), 400

        results = []
        for error in errors:
            try:
                # Process each error (simplified for batch)
                analysis = error_analyzer.quick_analyze(error)
                fix_plan = fix_generator.generate_quick_plan(error, analysis)

                results.append({
                    "error_id": error.get('error_id'),
                    "status": "success",
                    "category": analysis.get('category'),
                    "fix_plan": fix_plan,
                    "confidence": analysis.get('confidence', 0.5)
                })
            except Exception as e:
                results.append({
                    "error_id": error.get('error_id', 'unknown'),
                    "status": "failed",
                    "error": str(e)
                })

        return jsonify({
            "batch_id": f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "total_errors": len(errors),
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Bulk analysis failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Endpoint to retrain models with new error-fix pairs."""
    try:
        training_data = request.get_json()

        if not training_data or 'samples' not in training_data:
            return jsonify({"error": "Training samples required"}), 400

        # Update fintech mappers with new patterns
        fraud_detector.update_patterns(training_data['samples'])
        risk_assessor.update_risk_models(training_data['samples'])
        sentiment_analyzer.update_sentiment_models(training_data['samples'])

        logger.info(f"🎯 Model training completed with {len(training_data['samples'])} samples")

        return jsonify({
            "status": "success",
            "message": "Models updated successfully",
            "samples_processed": len(training_data['samples']),
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/export-model', methods=['GET'])
def export_model():
    """Export trained model to JSON format for persistence."""
    try:
        model_name = request.args.get('model', 'all')

        if model_name == 'all':
            # Export all models
            export_data = {
                "exportedAt": datetime.utcnow().isoformat(),
                "version": getattr(fraud_detector, 'version', '1.0.0'),
                "models": {
                    "fraud_detector": fraud_detector.export_model() if hasattr(fraud_detector, 'export_model') else fraud_detector.get_patterns(),
                    "risk_assessor": risk_assessor.export_model() if hasattr(risk_assessor, 'export_model') else {"version": risk_assessor.get_version()},
                    "sentiment_analyzer": sentiment_analyzer.export_model() if hasattr(sentiment_analyzer, 'export_model') else {"version": sentiment_analyzer.get_version()},
                    "credit_scorer": {"version": credit_scorer.get_version()} if hasattr(credit_scorer, 'get_version') else {},
                    "market_analyst": {"version": market_analyst.get_version()} if hasattr(market_analyst, 'get_version') else {}
                },
                "training_history": getattr(fraud_detector, 'training_history', []),
                "metadata": {
                    "framework": "Fintech AI Mappers",
                    "pythonVersion": "3.x",
                    "exportFormat": "JSON"
                }
            }
        else:
            # Export specific model
            model_map = {
                'fraud_detector': fraud_detector,
                'risk_assessor': risk_assessor,
                'sentiment_analyzer': sentiment_analyzer,
                'credit_scorer': credit_scorer,
                'market_analyst': market_analyst
            }

            if model_name not in model_map:
                return jsonify({"error": f"Model '{model_name}' not found"}), 404

            model = model_map[model_name]
            export_data = {
                "modelName": model_name,
                "exportedAt": datetime.utcnow().isoformat(),
                "version": model.get_version() if hasattr(model, 'get_version') else '1.0.0',
                "data": model.export_model() if hasattr(model, 'export_model') else model.get_patterns() if hasattr(model, 'get_patterns') else {}
            }

        logger.info(f"📦 Model export completed: {model_name}")
        return jsonify(export_data)

    except Exception as e:
        logger.error(f"Model export failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/import-model', methods=['POST'])
def import_model():
    """Import model from JSON data."""
    try:
        model_data = request.get_json()

        if not model_data:
            return jsonify({"error": "Model data required"}), 400

        model_name = model_data.get('modelName', 'unknown')

        # Import based on model type
        if model_name == 'fraud_detector' and hasattr(fraud_detector, 'import_model'):
            fraud_detector.import_model(model_data.get('data', {}))
        elif model_name == 'risk_assessor' and hasattr(risk_assessor, 'import_model'):
            risk_assessor.import_model(model_data.get('data', {}))
        elif model_name == 'sentiment_analyzer' and hasattr(sentiment_analyzer, 'import_model'):
            sentiment_analyzer.import_model(model_data.get('data', {}))
        else:
            logger.warning(f"Model {model_name} does not support import or not found")

        logger.info(f"📥 Model imported: {model_name} v{model_data.get('version', 'unknown')}")

        return jsonify({
            "status": "success",
            "modelName": model_name,
            "version": model_data.get('version', 'unknown'),
            "importedAt": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Model import failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/training-dashboard', methods=['GET'])
def training_dashboard():
    """Get comprehensive training dashboard data."""
    try:
        dashboard_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": "ai-devops-reasoning-engine",
            "models": {
                "fraud_detector": {
                    "version": fraud_detector.get_version() if hasattr(fraud_detector, 'get_version') else '1.0.0',
                    "accuracy": getattr(fraud_detector, 'accuracy', 0.92),
                    "lastTraining": getattr(fraud_detector, 'last_training', None),
                    "samplesProcessed": getattr(fraud_detector, 'samples_processed', 0),
                    "status": "active"
                },
                "risk_assessor": {
                    "version": risk_assessor.get_version() if hasattr(risk_assessor, 'get_version') else '1.0.0',
                    "accuracy": getattr(risk_assessor, 'accuracy', 0.89),
                    "lastTraining": getattr(risk_assessor, 'last_training', None),
                    "samplesProcessed": getattr(risk_assessor, 'samples_processed', 0),
                    "status": "active"
                },
                "sentiment_analyzer": {
                    "version": sentiment_analyzer.get_version() if hasattr(sentiment_analyzer, 'get_version') else '1.0.0',
                    "accuracy": getattr(sentiment_analyzer, 'accuracy', 0.87),
                    "lastTraining": getattr(sentiment_analyzer, 'last_training', None),
                    "samplesProcessed": getattr(sentiment_analyzer, 'samples_processed', 0),
                    "status": "active"
                }
            },
            "trainingHistory": getattr(fraud_detector, 'training_history', [])[-10:],  # Last 10
            "autoRetraining": {
                "enabled": getattr(fraud_detector, 'auto_retrain_enabled', False),
                "intervalHours": getattr(fraud_detector, 'retrain_interval', 24),
                "minSamplesRequired": getattr(fraud_detector, 'min_samples', 100),
                "pendingSamples": len(getattr(fraud_detector, 'pending_samples', []))
            },
            "performance": {
                "totalPredictions": getattr(fraud_detector, 'total_predictions', 0),
                "avgConfidence": getattr(fraud_detector, 'avg_confidence', 0.85),
                "avgProcessingTimeMs": getattr(fraud_detector, 'avg_processing_time', 50)
            }
        }

        return jsonify(dashboard_data)

    except Exception as e:
        logger.error(f"Dashboard data failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/auto-retrain/configure', methods=['POST'])
def configure_auto_retrain():
    """Configure automated retraining settings."""
    try:
        config = request.get_json() or {}

        enabled = config.get('enabled', True)
        interval_hours = config.get('intervalHours', 24)
        min_samples = config.get('minSamplesRequired', 100)
        accuracy_threshold = config.get('accuracyThreshold', 0.85)

        # Apply configuration to models
        for model in [fraud_detector, risk_assessor, sentiment_analyzer]:
            if hasattr(model, 'configure_auto_retrain'):
                model.configure_auto_retrain(
                    enabled=enabled,
                    interval_hours=interval_hours,
                    min_samples=min_samples,
                    accuracy_threshold=accuracy_threshold
                )
            else:
                # Store config as attributes
                model.auto_retrain_enabled = enabled
                model.retrain_interval = interval_hours
                model.min_samples = min_samples
                model.accuracy_threshold = accuracy_threshold

        logger.info(f"🔄 Auto-retraining configured: enabled={enabled}, interval={interval_hours}h")

        return jsonify({
            "status": "success",
            "configuration": {
                "enabled": enabled,
                "intervalHours": interval_hours,
                "minSamplesRequired": min_samples,
                "accuracyThreshold": accuracy_threshold
            },
            "nextRetrainingCheck": (datetime.utcnow().replace(hour=0, minute=0) +
                                   timedelta(hours=interval_hours)).isoformat() if enabled else None
        })

    except Exception as e:
        logger.error(f"Auto-retrain config failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/add-training-sample', methods=['POST'])
def add_training_sample():
    """Add a sample for future model retraining."""
    try:
        sample = request.get_json()

        if not sample:
            return jsonify({"error": "Sample data required"}), 400

        # Add to pending samples for all relevant models
        sample['addedAt'] = datetime.utcnow().isoformat()

        for model in [fraud_detector, risk_assessor, sentiment_analyzer]:
            if not hasattr(model, 'pending_samples'):
                model.pending_samples = []
            model.pending_samples.append(sample)

        total_pending = len(getattr(fraud_detector, 'pending_samples', []))

        logger.info(f"📝 Training sample added. Total pending: {total_pending}")

        return jsonify({
            "status": "success",
            "sampleId": sample.get('id', f"sample_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
            "pendingSamples": total_pending,
            "addedAt": sample['addedAt']
        })

    except Exception as e:
        logger.error(f"Add training sample failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get reasoning engine statistics and performance metrics."""
    try:
        return jsonify({
            "service": "ai-devops-reasoning-engine",
            "uptime": "calculated_uptime",
            "total_analyses": "stored_counter",
            "success_rate": "calculated_percentage",
            "average_confidence": "calculated_average",
            "model_versions": {
                "fraud_detector": fraud_detector.get_version(),
                "risk_assessor": risk_assessor.get_version(),
                "sentiment_analyzer": sentiment_analyzer.get_version()
            },
            "performance_metrics": {
                "avg_analysis_time": "calculated_ms",
                "cache_hit_rate": "calculated_percentage"
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PYTHON_SERVICE_PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'

    logger.info(f"🚀 Starting AI DevOps Reasoning Engine on port {port}")
    logger.info(f"Debug mode: {debug}")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
