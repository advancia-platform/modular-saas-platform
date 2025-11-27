#!/usr/bin/env python3
"""
Fix Plan Generation Script for AI DevOps Agent
Called by Node.js controller to generate comprehensive fix plans
"""

import sys
import json
import asyncio
from AIReasoningEngine import AIReasoningEngine, ErrorAnalysis

async def main():
    try:
        # Read analysis result from stdin
        input_data = sys.stdin.read()
        analysis_data = json.loads(input_data)

        # Convert to ErrorAnalysis object
        analysis = ErrorAnalysis(
            error_id=analysis_data['error_id'],
            root_cause=analysis_data['root_cause'],
            confidence_score=analysis_data['confidence_score'],
            risk_assessment=analysis_data['risk_assessment'],
            similar_patterns=analysis_data['similar_patterns'],
            impact_analysis=analysis_data['impact_analysis'],
            fix_recommendations=analysis_data['fix_recommendations'],
            estimated_fix_time=analysis_data['estimated_fix_time'],
            requires_human_review=analysis_data['requires_human_review']
        )

        # Initialize reasoning engine
        config = {
            'openai_api_key': 'your-openai-key',  # Should come from environment
            'debug': True
        }

        engine = AIReasoningEngine(config)

        # Generate fix plan
        fix_plan = await engine.generate_fix_plan(analysis)

        # Convert to dict and output as JSON
        fix_plan_dict = {
            'analysis_id': fix_plan.analysis_id,
            'strategy': fix_plan.strategy.value,
            'actions': fix_plan.actions,
            'test_requirements': fix_plan.test_requirements,
            'rollback_plan': fix_plan.rollback_plan,
            'validation_criteria': fix_plan.validation_criteria,
            'estimated_duration': fix_plan.estimated_duration,
            'risk_factors': fix_plan.risk_factors
        }

        print(json.dumps(fix_plan_dict, indent=2))

    except Exception as e:
        error_response = {
            'error': 'Fix plan generation failed',
            'message': str(e),
            'analysis_id': analysis_data.get('error_id', 'unknown') if 'analysis_data' in locals() else 'unknown'
        }
        print(json.dumps(error_response, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
