#!/usr/bin/env python3
"""
AI DevOps Agent - Core AI Models
===============================

This module contains the core AI models for error analysis and fix generation,
enhanced with fintech intelligence from our 12 AI function mappers.
"""

import os
import json
import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import openai
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class AnalysisResult:
    """Structured result from error analysis."""
    category: str
    severity: str
    root_cause: str
    confidence: float
    affected_components: List[str]
    similar_errors: List[Dict]
    ai_insights: Dict[str, Any]

@dataclass
class FixPlan:
    """Structured fix plan with deployment strategy."""
    action_type: str
    target_files: List[str]
    code_changes: List[Dict]
    test_requirements: List[str]
    rollback_plan: Dict
    deployment_strategy: str
    estimated_time: str
    risk_level: str
    validation_steps: List[str]

class ErrorAnalyzer:
    """
    Core error analysis engine that uses AI and pattern recognition
    to understand and classify errors with fintech intelligence.
    """

    def __init__(self):
        self.openai_available = bool(os.getenv('OPENAI_API_KEY'))
        self.error_patterns = self._load_error_patterns()
        self.analysis_cache = {}

        logger.info(f"ErrorAnalyzer initialized - OpenAI available: {self.openai_available}")

    def _load_error_patterns(self) -> Dict:
        """Load known error patterns and their solutions."""
        return {
            'import_errors': {
                'patterns': [r'ImportError', r'ModuleNotFoundError', r'Cannot import'],
                'category': 'dependency',
                'severity': 'medium',
                'common_fixes': ['install_package', 'add_import', 'fix_path']
            },
            'syntax_errors': {
                'patterns': [r'SyntaxError', r'IndentationError', r'invalid syntax'],
                'category': 'syntax',
                'severity': 'high',
                'common_fixes': ['fix_syntax', 'fix_indentation', 'add_missing_bracket']
            },
            'type_errors': {
                'patterns': [r'TypeError', r'AttributeError', r"'NoneType'"],
                'category': 'type',
                'severity': 'medium',
                'common_fixes': ['add_null_check', 'fix_type_casting', 'validate_input']
            },
            'runtime_errors': {
                'patterns': [r'RuntimeError', r'ValueError', r'KeyError'],
                'category': 'runtime',
                'severity': 'high',
                'common_fixes': ['add_error_handling', 'validate_data', 'fix_logic']
            },
            'security_vulnerabilities': {
                'patterns': [r'SQL injection', r'XSS', r'CSRF', r'authentication'],
                'category': 'security',
                'severity': 'critical',
                'common_fixes': ['sanitize_input', 'add_validation', 'update_dependencies']
            },
            'performance_issues': {
                'patterns': [r'timeout', r'memory', r'slow query', r'high CPU'],
                'category': 'performance',
                'severity': 'medium',
                'common_fixes': ['optimize_query', 'add_caching', 'improve_algorithm']
            },
            'deployment_failures': {
                'patterns': [r'deployment failed', r'container crash', r'health check'],
                'category': 'deployment',
                'severity': 'critical',
                'common_fixes': ['fix_config', 'update_dockerfile', 'scale_resources']
            },
            'network_errors': {
                'patterns': [r'connection refused', r'timeout', r'DNS', r'503'],
                'category': 'network',
                'severity': 'high',
                'common_fixes': ['check_connectivity', 'update_endpoints', 'add_retries']
            }
        }

    def analyze(self, error_payload: Dict, fintech_context: Dict) -> AnalysisResult:
        """
        Perform comprehensive error analysis using AI and fintech intelligence.

        Args:
            error_payload: The error data to analyze
            fintech_context: Results from fintech AI mappers

        Returns:
            AnalysisResult with detailed analysis
        """
        try:
            error_message = error_payload.get('message', '')
            stack_trace = error_payload.get('stack_trace', '')
            context = error_payload.get('context', {})

            # Step 1: Pattern-based classification
            pattern_result = self._classify_by_patterns(error_message, stack_trace)

            # Step 2: AI-enhanced analysis if available
            ai_insights = {}
            if self.openai_available:
                ai_insights = self._ai_analyze(error_payload, fintech_context)

            # Step 3: Combine pattern and AI results
            final_category = ai_insights.get('category', pattern_result['category'])
            final_severity = self._determine_severity(
                pattern_result['severity'],
                ai_insights.get('severity'),
                fintech_context.get('risk_factors', {})
            )

            # Step 4: Find similar errors from history
            similar_errors = self._find_similar_errors(error_message, stack_trace)

            # Step 5: Extract affected components
            affected_components = self._extract_affected_components(
                stack_trace, context
            )

            # Step 6: Determine root cause using fintech intelligence
            root_cause = self._determine_root_cause(
                error_payload, ai_insights, fintech_context
            )

            # Step 7: Calculate confidence score
            confidence = self._calculate_confidence(
                pattern_result, ai_insights, fintech_context
            )

            result = AnalysisResult(
                category=final_category,
                severity=final_severity,
                root_cause=root_cause,
                confidence=confidence,
                affected_components=affected_components,
                similar_errors=similar_errors,
                ai_insights=ai_insights
            )

            logger.info(f"Analysis complete: {final_category}/{final_severity} - Confidence: {confidence:.2f}")
            return result

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            # Return safe fallback
            return AnalysisResult(
                category='unknown',
                severity='medium',
                root_cause='Analysis failed - manual review required',
                confidence=0.1,
                affected_components=[],
                similar_errors=[],
                ai_insights={'error': str(e)}
            )

    def quick_analyze(self, error_payload: Dict) -> Dict:
        """Quick analysis for batch processing."""
        error_message = error_payload.get('message', '')
        pattern_result = self._classify_by_patterns(error_message, '')

        return {
            'category': pattern_result['category'],
            'severity': pattern_result['severity'],
            'confidence': pattern_result.get('confidence', 0.7)
        }

    def _classify_by_patterns(self, message: str, stack_trace: str) -> Dict:
        """Classify error using regex patterns."""
        full_text = f"{message} {stack_trace}".lower()

        for error_type, config in self.error_patterns.items():
            for pattern in config['patterns']:
                if re.search(pattern.lower(), full_text):
                    return {
                        'category': config['category'],
                        'severity': config['severity'],
                        'error_type': error_type,
                        'confidence': 0.8,
                        'common_fixes': config['common_fixes']
                    }

        # Default classification
        return {
            'category': 'unknown',
            'severity': 'medium',
            'error_type': 'unclassified',
            'confidence': 0.3,
            'common_fixes': ['manual_investigation']
        }

    def _ai_analyze(self, error_payload: Dict, fintech_context: Dict) -> Dict:
        """Use OpenAI to analyze error with fintech context."""
        try:
            prompt = self._build_ai_prompt(error_payload, fintech_context)

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert DevOps engineer with fintech domain knowledge. Analyze errors and provide structured insights."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.1
            )

            ai_response = response.choices[0].message.content
            return self._parse_ai_response(ai_response)

        except Exception as e:
            logger.warning(f"AI analysis failed: {str(e)}")
            return {}

    def _build_ai_prompt(self, error_payload: Dict, fintech_context: Dict) -> str:
        """Build AI prompt with fintech intelligence context."""
        return f"""
        Analyze this error with fintech domain expertise:

        ERROR DETAILS:
        - Message: {error_payload.get('message', 'N/A')}
        - Stack Trace: {error_payload.get('stack_trace', 'N/A')[:1000]}
        - File: {error_payload.get('context', {}).get('file_path', 'N/A')}
        - Environment: {error_payload.get('context', {}).get('environment', 'N/A')}

        FINTECH INTELLIGENCE:
        - Fraud Risk Indicators: {fintech_context.get('fraud_indicators', {})}
        - Risk Assessment: {fintech_context.get('risk_factors', {})}
        - Code Quality Sentiment: {fintech_context.get('sentiment_scores', {})}
        - System Health Score: {fintech_context.get('health_metrics', {})}

        Provide analysis in this JSON format:
        {{
            "category": "security|performance|dependency|syntax|runtime|deployment|network",
            "severity": "critical|high|medium|low",
            "root_cause": "concise explanation",
            "financial_impact": "assessment of potential business impact",
            "compliance_risk": "regulatory or compliance concerns",
            "recommended_priority": "immediate|high|normal|low"
        }}
        """

    def _parse_ai_response(self, response: str) -> Dict:
        """Parse AI response into structured data."""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback parsing
                return self._fallback_parse_ai_response(response)
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {str(e)}")
            return {}

    def _fallback_parse_ai_response(self, response: str) -> Dict:
        """Fallback parsing when JSON extraction fails."""
        result = {}

        # Extract category
        category_match = re.search(r'category["\s:]+([a-z]+)', response.lower())
        if category_match:
            result['category'] = category_match.group(1)

        # Extract severity
        severity_match = re.search(r'severity["\s:]+([a-z]+)', response.lower())
        if severity_match:
            result['severity'] = severity_match.group(1)

        return result

    def _determine_severity(self, pattern_severity: str, ai_severity: Optional[str],
                          risk_factors: Dict) -> str:
        """Determine final severity considering all factors."""
        severity_scores = {
            'low': 1, 'medium': 2, 'high': 3, 'critical': 4
        }

        pattern_score = severity_scores.get(pattern_severity, 2)
        ai_score = severity_scores.get(ai_severity, 2) if ai_severity else 2

        # Consider risk factors from fintech analysis
        risk_score = risk_factors.get('score', 0.5)
        if risk_score > 0.8:
            pattern_score += 1
        elif risk_score < 0.3:
            pattern_score -= 1

        # Average and clamp
        final_score = max(1, min(4, round((pattern_score + ai_score) / 2)))

        score_to_severity = {1: 'low', 2: 'medium', 3: 'high', 4: 'critical'}
        return score_to_severity[final_score]

    def _find_similar_errors(self, message: str, stack_trace: str) -> List[Dict]:
        """Find similar historical errors."""
        # Simplified implementation - in production, use vector similarity
        similar = []

        # Extract key terms for matching
        key_terms = re.findall(r'[A-Z][a-z]+Error|[A-Z][a-z]+Exception', message)

        if key_terms:
            similar.append({
                'error_type': key_terms[0],
                'similarity_score': 0.8,
                'resolution': 'Historical fix available'
            })

        return similar

    def _extract_affected_components(self, stack_trace: str, context: Dict) -> List[str]:
        """Extract affected system components from error context."""
        components = set()

        # Extract from file paths
        file_path = context.get('file_path', '')
        if file_path:
            path_parts = file_path.split('/')
            if len(path_parts) > 1:
                components.add(path_parts[-2])  # Parent directory as component

        # Extract from stack trace
        if 'database' in stack_trace.lower():
            components.add('database')
        if 'api' in stack_trace.lower() or 'endpoint' in stack_trace.lower():
            components.add('api')
        if 'auth' in stack_trace.lower():
            components.add('authentication')
        if 'payment' in stack_trace.lower():
            components.add('payment_processing')

        return list(components)

    def _determine_root_cause(self, error_payload: Dict, ai_insights: Dict,
                            fintech_context: Dict) -> str:
        """Determine root cause using all available intelligence."""

        # Start with AI insights if available
        if ai_insights.get('root_cause'):
            base_cause = ai_insights['root_cause']
        else:
            base_cause = "Error analysis incomplete"

        # Enhance with fintech context
        fraud_indicators = fintech_context.get('fraud_indicators', {})
        if fraud_indicators.get('suspicious_patterns'):
            base_cause += " - Suspicious error patterns detected"

        risk_factors = fintech_context.get('risk_factors', {})
        if risk_factors.get('score', 0) > 0.7:
            base_cause += " - High risk deployment environment"

        return base_cause

    def _calculate_confidence(self, pattern_result: Dict, ai_insights: Dict,
                            fintech_context: Dict) -> float:
        """Calculate overall confidence in the analysis."""

        # Base confidence from pattern matching
        pattern_confidence = pattern_result.get('confidence', 0.5)

        # AI confidence if available
        ai_confidence = 0.8 if ai_insights else 0.5

        # Fintech intelligence boost
        fintech_boost = 0.0
        if fintech_context.get('fraud_indicators', {}).get('confidence', 0) > 0.7:
            fintech_boost += 0.1
        if fintech_context.get('health_metrics', {}).get('reliability', 0) > 0.8:
            fintech_boost += 0.1

        # Calculate weighted average
        final_confidence = min(1.0, (pattern_confidence + ai_confidence) / 2 + fintech_boost)

        return round(final_confidence, 3)

class FixPlanGenerator:
    """
    Generates intelligent fix plans based on error analysis and fintech context.
    """

    def __init__(self):
        self.fix_templates = self._load_fix_templates()
        self.deployment_strategies = self._load_deployment_strategies()

        logger.info("FixPlanGenerator initialized")

    def _load_fix_templates(self) -> Dict:
        """Load fix templates for different error types."""
        return {
            'import_errors': {
                'install_package': {
                    'action_type': 'dependency_install',
                    'commands': ['npm install {package}', 'pip install {package}'],
                    'validation': ['import {package}', 'test suite'],
                    'rollback': 'uninstall package'
                },
                'fix_import_path': {
                    'action_type': 'code_change',
                    'file_changes': 'update import statements',
                    'validation': ['syntax check', 'import test'],
                    'rollback': 'revert file changes'
                }
            },
            'syntax_errors': {
                'fix_syntax': {
                    'action_type': 'code_change',
                    'file_changes': 'correct syntax',
                    'validation': ['syntax check', 'linting'],
                    'rollback': 'revert file changes'
                }
            },
            'security_vulnerabilities': {
                'sanitize_input': {
                    'action_type': 'security_fix',
                    'file_changes': 'add input validation',
                    'validation': ['security scan', 'penetration test'],
                    'rollback': 'revert with security review'
                }
            },
            'performance_issues': {
                'optimize_query': {
                    'action_type': 'performance_fix',
                    'file_changes': 'optimize database queries',
                    'validation': ['performance test', 'load test'],
                    'rollback': 'revert with monitoring'
                }
            }
        }

    def _load_deployment_strategies(self) -> Dict:
        """Load deployment strategies based on risk levels."""
        return {
            'blue_green': {
                'description': 'Deploy to green environment, then switch',
                'risk_level': 'low',
                'rollback_time': '< 1 minute'
            },
            'canary': {
                'description': 'Gradual rollout to subset of users',
                'risk_level': 'medium',
                'rollback_time': '< 5 minutes'
            },
            'rolling': {
                'description': 'Rolling update across instances',
                'risk_level': 'medium',
                'rollback_time': '< 10 minutes'
            },
            'maintenance_window': {
                'description': 'Deploy during scheduled maintenance',
                'risk_level': 'high',
                'rollback_time': 'varies'
            }
        }

    def generate_plan(self, error_payload: Dict, analysis_result: AnalysisResult,
                     deployment_strategy: Dict) -> FixPlan:
        """Generate comprehensive fix plan."""
        try:
            # Determine fix approach based on error category
            fix_approach = self._select_fix_approach(
                analysis_result.category,
                analysis_result.severity,
                deployment_strategy
            )

            # Generate specific code changes
            code_changes = self._generate_code_changes(
                error_payload, analysis_result, fix_approach
            )

            # Select deployment strategy
            deploy_strategy = self._select_deployment_strategy(
                analysis_result.severity,
                deployment_strategy.get('risk_level', 'medium')
            )

            # Generate test requirements
            test_requirements = self._generate_test_requirements(
                analysis_result.category, code_changes
            )

            # Generate rollback plan
            rollback_plan = self._generate_rollback_plan(
                fix_approach, deploy_strategy
            )

            # Estimate resolution time
            estimated_time = self._estimate_resolution_time(
                analysis_result.category, analysis_result.severity,
                len(code_changes)
            )

            # Generate validation steps
            validation_steps = self._generate_validation_steps(
                analysis_result.category, test_requirements
            )

            fix_plan = FixPlan(
                action_type=fix_approach['action_type'],
                target_files=self._extract_target_files(error_payload, code_changes),
                code_changes=code_changes,
                test_requirements=test_requirements,
                rollback_plan=rollback_plan,
                deployment_strategy=deploy_strategy,
                estimated_time=estimated_time,
                risk_level=deployment_strategy.get('risk_level', 'medium'),
                validation_steps=validation_steps
            )

            logger.info(f"Fix plan generated: {fix_approach['action_type']} - {deploy_strategy}")
            return fix_plan

        except Exception as e:
            logger.error(f"Fix plan generation failed: {str(e)}")
            return self._generate_fallback_plan(error_payload, analysis_result)

    def generate_quick_plan(self, error_payload: Dict, analysis: Dict) -> Dict:
        """Generate quick fix plan for batch processing."""
        category = analysis.get('category', 'unknown')

        if category in self.fix_templates:
            template = list(self.fix_templates[category].values())[0]
            return {
                'action_type': template['action_type'],
                'estimated_time': '5-15 minutes',
                'confidence': analysis.get('confidence', 0.5)
            }

        return {
            'action_type': 'manual_investigation',
            'estimated_time': '30-60 minutes',
            'confidence': 0.3
        }

    def _select_fix_approach(self, category: str, severity: str,
                           deployment_strategy: Dict) -> Dict:
        """Select the best fix approach."""

        if category in self.fix_templates:
            # Select first available template (can be enhanced with ML)
            approach_name = list(self.fix_templates[category].keys())[0]
            return self.fix_templates[category][approach_name]

        # Default approach for unknown categories
        return {
            'action_type': 'manual_investigation',
            'commands': [],
            'validation': ['manual_review'],
            'rollback': 'manual_revert'
        }

    def _generate_code_changes(self, error_payload: Dict,
                             analysis_result: AnalysisResult,
                             fix_approach: Dict) -> List[Dict]:
        """Generate specific code changes needed."""
        changes = []

        # Extract change details from error context
        context = error_payload.get('context', {})
        file_path = context.get('file_path')
        line_number = context.get('line_number')

        if file_path and line_number:
            change = {
                'file': file_path,
                'line': line_number,
                'type': fix_approach['action_type'],
                'description': f"Fix {analysis_result.category} error",
                'change_details': self._generate_change_details(
                    analysis_result, fix_approach
                )
            }
            changes.append(change)

        return changes

    def _generate_change_details(self, analysis_result: AnalysisResult,
                               fix_approach: Dict) -> Dict:
        """Generate specific change details."""
        if analysis_result.category == 'import_errors':
            return {
                'action': 'add_import',
                'import_statement': 'import missing_module',
                'package_install': 'npm install missing_module'
            }
        elif analysis_result.category == 'syntax_errors':
            return {
                'action': 'fix_syntax',
                'syntax_fix': 'correct syntax error',
                'validation': 'run linter'
            }
        else:
            return {
                'action': 'generic_fix',
                'description': f"Fix {analysis_result.category} issue"
            }

    def _select_deployment_strategy(self, severity: str, risk_level: str) -> str:
        """Select deployment strategy based on severity and risk."""

        if severity == 'critical':
            return 'blue_green'  # Safest for critical fixes
        elif severity == 'high':
            return 'canary'      # Gradual rollout for high severity
        elif risk_level == 'high':
            return 'maintenance_window'  # Schedule high-risk deployments
        else:
            return 'rolling'     # Default strategy

    def _generate_test_requirements(self, category: str,
                                  code_changes: List[Dict]) -> List[str]:
        """Generate test requirements based on changes."""
        tests = ['unit_tests', 'integration_tests']

        if category == 'security':
            tests.extend(['security_tests', 'penetration_tests'])
        elif category == 'performance':
            tests.extend(['performance_tests', 'load_tests'])
        elif category == 'deployment':
            tests.extend(['deployment_tests', 'health_checks'])

        return tests

    def _generate_rollback_plan(self, fix_approach: Dict,
                              deploy_strategy: str) -> Dict:
        """Generate comprehensive rollback plan."""
        return {
            'strategy': deploy_strategy,
            'steps': [
                'monitor metrics after deployment',
                'rollback if errors increase',
                'notify team of rollback'
            ],
            'triggers': [
                'error_rate > 5%',
                'response_time > 2x baseline',
                'manual_trigger'
            ],
            'rollback_command': fix_approach.get('rollback', 'manual_revert')
        }

    def _estimate_resolution_time(self, category: str, severity: str,
                                change_count: int) -> str:
        """Estimate time to resolution."""
        base_times = {
            'dependency': '5-10 minutes',
            'syntax': '2-5 minutes',
            'security': '30-60 minutes',
            'performance': '15-45 minutes',
            'deployment': '10-30 minutes'
        }

        base_time = base_times.get(category, '15-30 minutes')

        # Adjust for severity
        if severity == 'critical':
            return f"URGENT - {base_time}"
        elif severity == 'low':
            return f"LOW PRIORITY - {base_time}"

        return base_time

    def _generate_validation_steps(self, category: str,
                                 test_requirements: List[str]) -> List[str]:
        """Generate validation steps."""
        steps = [
            'run automated tests',
            'verify error resolution',
            'check system metrics'
        ]

        if 'security_tests' in test_requirements:
            steps.append('run security validation')

        if 'performance_tests' in test_requirements:
            steps.append('validate performance metrics')

        steps.append('monitor for 24 hours')

        return steps

    def _extract_target_files(self, error_payload: Dict,
                            code_changes: List[Dict]) -> List[str]:
        """Extract target files for the fix."""
        files = []

        # From error context
        context = error_payload.get('context', {})
        if context.get('file_path'):
            files.append(context['file_path'])

        # From code changes
        for change in code_changes:
            if change.get('file'):
                files.append(change['file'])

        return list(set(files))  # Remove duplicates

    def _generate_fallback_plan(self, error_payload: Dict,
                              analysis_result: AnalysisResult) -> FixPlan:
        """Generate safe fallback plan when automatic generation fails."""
        return FixPlan(
            action_type='manual_investigation',
            target_files=[],
            code_changes=[],
            test_requirements=['manual_testing'],
            rollback_plan={'strategy': 'manual', 'steps': ['revert changes']},
            deployment_strategy='maintenance_window',
            estimated_time='60+ minutes',
            risk_level='high',
            validation_steps=['manual_validation', 'team_review']
        )
