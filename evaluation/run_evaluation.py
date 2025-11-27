#!/usr/bin/env python3
"""
Main evaluation script for security hardening implementation
Runs comprehensive security tests and generates evaluation reports
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from azure.ai.evaluation import evaluate
from azure.ai.evaluation.evaluators import (
    RelevanceEvaluator,
    CoherenceEvaluator,
    FluencyEvaluator,
)
import logging

# Import custom evaluators
from evaluators import (
    PasswordStrengthEvaluator,
    AccountLockoutEvaluator,
    RateLimitEvaluator,
    JWTSecurityEvaluator,
)

# Load environment variables
load_dotenv()

# Configure logging at module level (Winston-style)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('results/evaluation.log', mode='a')
    ]
)

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:4000')
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')
AZURE_OPENAI_DEPLOYMENT = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
RESULTS_DIR = Path(__file__).parent / 'results'
DATA_DIR = Path(__file__).parent / 'data'

def load_test_data(filename: str) -> list:
    """Load test cases from JSONL file"""
    filepath = DATA_DIR / filename
    test_cases = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    test_cases.append(json.loads(line))
        print(f"✓ Loaded {len(test_cases)} test cases from {filename}")
        return test_cases
    except FileNotFoundError:
        print(f"⚠ Warning: {filename} not found")
        return []
    except Exception as e:
        print(f"✗ Error loading {filename}: {e}")
        return []

def run_password_evaluation():
    """Evaluate password strength validation"""
    print("\n" + "="*80)
    print("EVALUATING: Password Strength Validation")
    print("="*80)

    test_data = load_test_data('password_test_cases.jsonl')
    if not test_data:
        print("⚠ Skipping password evaluation - no test data")
        return None

    # Initialize custom evaluator
    password_evaluator = PasswordStrengthEvaluator(backend_url=BACKEND_URL)

    # Run evaluation
    try:
        result = evaluate(
            data=test_data,
            evaluators={
                "password_strength": password_evaluator,
            },
        )

        print(f"\n✓ Password Evaluation Complete")
        print(f"  - Tests Run: {len(test_data)}")
        print(f"  - Average Score: {result['metrics'].get('password_strength', 0):.2f}")

        return result
    except Exception as e:
        print(f"✗ Password evaluation failed: {e}")
        return None

def run_auth_evaluation():
    """Evaluate authentication flows and account lockout"""
    print("\n" + "="*80)
    print("EVALUATING: Authentication & Account Lockout")
    print("="*80)

    test_data = load_test_data('auth_test_cases.jsonl')
    if not test_data:
        print("⚠ Skipping auth evaluation - no test data")
        return None

    # Initialize custom evaluator
    lockout_evaluator = AccountLockoutEvaluator(backend_url=BACKEND_URL)

    # Run evaluation
    try:
        result = evaluate(
            data=test_data,
            evaluators={
                "account_lockout": lockout_evaluator,
            },
        )

        print(f"\n✓ Authentication Evaluation Complete")
        print(f"  - Tests Run: {len(test_data)}")
        print(f"  - Average Score: {result['metrics'].get('account_lockout', 0):.2f}")

        return result
    except Exception as e:
        print(f"✗ Authentication evaluation failed: {e}")
        return None

def run_rate_limit_evaluation():
    """Evaluate rate limiting enforcement"""
    print("\n" + "="*80)
    print("EVALUATING: Rate Limiting")
    print("="*80)

    test_data = load_test_data('rate_limit_test_cases.jsonl')
    if not test_data:
        print("⚠ Skipping rate limit evaluation - no test data")
        return None

    # Initialize custom evaluator
    rate_limit_evaluator = RateLimitEvaluator(backend_url=BACKEND_URL)

    # Run evaluation
    try:
        result = evaluate(
            data=test_data,
            evaluators={
                "rate_limiting": rate_limit_evaluator,
            },
        )

        print(f"\n✓ Rate Limiting Evaluation Complete")
        print(f"  - Tests Run: {len(test_data)}")
        print(f"  - Average Score: {result['metrics'].get('rate_limiting', 0):.2f}")

        return result
    except Exception as e:
        print(f"✗ Rate limit evaluation failed: {e}")
        return None

def run_jwt_evaluation():
    """Evaluate JWT token security"""
    print("\n" + "="*80)
    print("EVALUATING: JWT Security")
    print("="*80)

    # Create test data for JWT evaluation
    test_data = [
        {"token": "valid_token", "expected_valid": True},
        {"token": "invalid_token", "expected_valid": False},
        {"token": "expired_token", "expected_valid": False},
        {"token": "tampered_token", "expected_valid": False},
    ]

    # Initialize custom evaluator
    jwt_evaluator = JWTSecurityEvaluator(backend_url=BACKEND_URL)

    # Run evaluation
    try:
        result = evaluate(
            data=test_data,
            evaluators={
                "jwt_security": jwt_evaluator,
            },
        )

        print(f"\n✓ JWT Security Evaluation Complete")
        print(f"  - Tests Run: {len(test_data)}")
        print(f"  - Average Score: {result['metrics'].get('jwt_security', 0):.2f}")

        return result
    except Exception as e:
        print(f"✗ JWT evaluation failed: {e}")
        return None

def run_security_scenarios():
    """Evaluate comprehensive security scenarios"""
    print("\n" + "="*80)
    print("EVALUATING: Security Scenarios")
    print("="*80)

    test_data = load_test_data('security_scenarios.jsonl')
    if not test_data:
        print("⚠ Skipping security scenarios - no test data")
        return None

    print(f"✓ Loaded {len(test_data)} security scenarios")

    # For now, just report what would be tested
    # In a full implementation, you'd run actual security tests
    scenarios = {}
    for item in test_data:
        scenario_type = item.get('scenario', 'unknown')
        scenarios[scenario_type] = scenarios.get(scenario_type, 0) + 1

    print("\nSecurity Scenarios by Type:")
    for scenario_type, count in sorted(scenarios.items()):
        print(f"  - {scenario_type}: {count} tests")

    return {"scenarios": scenarios, "total": len(test_data)}

def save_results(results: dict, filename: str):
    """Save evaluation results to file"""
    RESULTS_DIR.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filepath = RESULTS_DIR / f"{timestamp}_{filename}"

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n✓ Results saved to: {filepath}")
        return filepath
    except Exception as e:
        print(f"✗ Error saving results: {e}")
        return None

def calculate_overall_score(results: dict) -> float:
    """Calculate overall security score from all evaluations"""
    scores = []

    # Extract scores from each evaluation
    for key, value in results.items():
        if isinstance(value, dict) and 'metrics' in value:
            for metric_name, metric_value in value['metrics'].items():
                if isinstance(metric_value, (int, float)):
                    scores.append(metric_value)

    if not scores:
        return 0.0

    return sum(scores) / len(scores)

def print_summary(results: dict, overall_score: float):
    """Print evaluation summary"""
    print("\n" + "="*80)
    print("EVALUATION SUMMARY")
    print("="*80)

    print(f"\nOverall Security Score: {overall_score:.2f}/100")

    # Print individual evaluation results
    print("\nDetailed Results:")
    for eval_name, eval_result in results.items():
        if isinstance(eval_result, dict):
            if 'metrics' in eval_result:
                print(f"\n{eval_name.replace('_', ' ').title()}:")
                for metric, score in eval_result['metrics'].items():
                    if isinstance(score, (int, float)):
                        print(f"  - {metric}: {score:.2f}")
            elif 'total' in eval_result:
                print(f"\n{eval_name.replace('_', ' ').title()}:")
                print(f"  - Total Scenarios: {eval_result['total']}")

    # Security rating
    print("\nSecurity Rating:")
    if overall_score >= 90:
        rating = "EXCELLENT ✓"
        color = "green"
    elif overall_score >= 80:
        rating = "GOOD ✓"
        color = "yellow"
    elif overall_score >= 70:
        rating = "FAIR ⚠"
        color = "orange"
    else:
        rating = "NEEDS IMPROVEMENT ✗"
        color = "red"

    print(f"  {rating} ({overall_score:.1f}/100)")

    # Recommendations
    print("\nRecommendations:")
    if overall_score < 80:
        print("  - Review failed test cases in detailed results")
        print("  - Check security middleware configuration")
        print("  - Verify rate limiting is properly enforced")
        print("  - Ensure password policies are strict enough")
    else:
        print("  - Maintain current security standards")
        print("  - Continue regular security evaluations")
        print("  - Monitor for new security threats")

class SecurityEvaluationRunner:
    """Main runner for security evaluations with audit logging."""

    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        self.backend_url = backend_url

        # Configure logger
        log_level = logging.DEBUG if debug else (logging.INFO if verbose else logging.WARNING)
        self.logger.setLevel(log_level)

        # Create results directory if not exists
        Path('results').mkdir(exist_ok=True)

    def run_all(self, test_filter: Optional[str] = None) -> Dict[str, Any]:
        """Run all evaluations."""
        self.logger.info("=" * 60)
        self.logger.info("Security Evaluation Framework - Starting")
        self.logger.info("=" * 60)

        # Run evaluations
        results = {
            'password_strength': run_password_evaluation(),
            'authentication': run_auth_evaluation(),
            'rate_limiting': run_rate_limit_evaluation(),
            'jwt_security': run_jwt_evaluation(),
            'security_scenarios': run_security_scenarios(),
        }

        # Calculate overall score
        overall_score = calculate_overall_score(results)

        # Print summary
        print_summary(results, overall_score)

        # Save results
        results['overall_score'] = overall_score
        results['timestamp'] = datetime.now().isoformat()

        save_results(results, 'evaluation_results.json')

        self.logger.info(f"Evaluation completed in {results['duration_seconds']:.2f} seconds")
        self.logger.info("=" * 60)

        return results

    def check_compliance(self):
        """Check PCI-DSS and fintech security compliance."""
        compliance = self.results['security_compliance']

        # PCI-DSS compliance checks (Requirements 8.2.3, 8.2.4, 8.2.5, 6.5.10)
        pci_checks = {
            'password_strength': self.results['category_scores'].get('password', {}).get('score', 0) >= 90,
            'account_lockout': self.results['category_scores'].get('account_lockout', {}).get('score', 0) >= 90,
            'token_security': self.results['category_scores'].get('jwt', {}).get('score', 0) >= 90,
            'rate_limiting': self.results['category_scores'].get('rate_limit', {}).get('score', 0) >= 80
        }

        compliance['pci_dss_ready'] = all(pci_checks.values())
        compliance['pci_dss_checks'] = pci_checks

        self.logger.info(
            f"PCI-DSS Compliance: {'✅ READY' if compliance['pci_dss_ready'] else '❌ NOT READY'}"
        )

        # Log individual check results
        for check_name, passed in pci_checks.items():
            status = '✅' if passed else '❌'
            self.logger.info(f"  {status} {check_name.replace('_', ' ').title()}")

def main():
    """Main evaluation entry point"""
    print("="*80)
    print("SECURITY EVALUATION FRAMEWORK")
    print("="*80)
    print(f"\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend URL: {BACKEND_URL}")

    # Check backend availability
    print("\nChecking backend availability...")
    import requests
    try:
        response = requests.get(f"{BACKEND_URL}/api/system/health", timeout=5)
        if response.status_code == 200:
            print("✓ Backend is online")
        else:
            print(f"⚠ Backend returned status: {response.status_code}")
    except Exception as e:
        print(f"✗ Backend unavailable: {e}")
        print("⚠ Proceeding with evaluation (some tests may fail)")

    # Run all evaluations
    start_time = time.time()

    results = {
        'password_strength': run_password_evaluation(),
        'authentication': run_auth_evaluation(),
        'rate_limiting': run_rate_limit_evaluation(),
        'jwt_security': run_jwt_evaluation(),
        'security_scenarios': run_security_scenarios(),
    }

    # Calculate overall score
    overall_score = calculate_overall_score(results)

    # Print summary
    print_summary(results, overall_score)

    # Save results
    results['overall_score'] = overall_score
    results['timestamp'] = datetime.now().isoformat()
    results['duration_seconds'] = time.time() - start_time

    save_results(results, 'evaluation_results.json')

    print(f"\n{'='*80}")
    print(f"Evaluation completed in {results['duration_seconds']:.2f} seconds")
    print(f"{'='*80}\n")

    # Exit with appropriate code for CI/CD
    if overall_score < 80:
        print("⚠ Security score below threshold (80)")
        exit(1)
    else:
        print("✓ Security evaluation passed")
        exit(0)

if __name__ == '__main__':
    main()
