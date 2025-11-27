#!/usr/bin/env python3
"""
Error Analysis Script for AI DevOps Agent
Called by Node.js controller to perform AI analysis on errors
"""

import sys
import json
import asyncio
from datetime import datetime
from AIReasoningEngine import AIReasoningEngine, ErrorEvent

async def main():
    try:
        # Read error event from stdin
        input_data = sys.stdin.read()
        error_data = json.loads(input_data)

        # Convert to ErrorEvent object
        error_event = ErrorEvent(
            id=error_data['id'],
            timestamp=datetime.fromisoformat(error_data['timestamp'].replace('Z', '+00:00')),
            source=error_data['source'],
            severity=error_data['severity'],
            error_type=error_data['type'],
            context=error_data['context'],
            raw_error=error_data['rawError'],
            metadata=error_data['metadata']
        )

        # Initialize reasoning engine
        config = {
            'openai_api_key': 'your-openai-key',  # Should come from environment
            'debug': True
        }

        engine = AIReasoningEngine(config)

        # Perform analysis
        analysis = await engine.analyze_error(error_event)

        # Convert to dict and output as JSON
        analysis_dict = {
            'error_id': analysis.error_id,
            'root_cause': analysis.root_cause,
            'confidence_score': analysis.confidence_score,
            'risk_assessment': analysis.risk_assessment,
            'similar_patterns': analysis.similar_patterns,
            'impact_analysis': analysis.impact_analysis,
            'fix_recommendations': analysis.fix_recommendations,
            'estimated_fix_time': analysis.estimated_fix_time,
            'requires_human_review': analysis.requires_human_review
        }

        print(json.dumps(analysis_dict, indent=2))

    except Exception as e:
        error_response = {
            'error': 'Analysis failed',
            'message': str(e),
            'error_id': error_data.get('id', 'unknown') if 'error_data' in locals() else 'unknown'
        }
        print(json.dumps(error_response, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
