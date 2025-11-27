"""
Authentication flow evaluator.
Tests authentication endpoints for proper validation and error handling.
"""

import json
import jsonlines
import requests
from pathlib import Path
from typing import Dict, List, Any

class AuthFlowEvaluator:
    """Evaluates authentication flow implementation."""

    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        self.backend_url = backend_url
        self.verbose = verbose
        self.debug = debug
        self.test_data_path = Path(__file__).parent.parent / 'data' / 'auth_test_cases.jsonl'

    def load_test_cases(self) -> List[Dict[str, Any]]:
        """Load auth test cases from JSONL file."""
        test_cases = []
        if self.test_data_path.exists():
            with jsonlines.open(self.test_data_path) as reader:
                for obj in reader:
                    test_cases.append(obj)
        return test_cases

    def execute_request(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single test request."""
        try:
            endpoint = f"{self.backend_url}{test_case['endpoint']}"
            method = test_case['method'].lower()
            payload = test_case.get('payload', {})

            if method == 'post':
                response = requests.post(endpoint, json=payload, timeout=10)
            elif method == 'get':
                response = requests.get(endpoint, params=payload, timeout=10)
            else:
                return {'status': 0, 'error': f'Unsupported method: {method}'}

            return {
                'status': response.status_code,
                'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else None,
                'error': None
            }
        except Exception as e:
            return {
                'status': 0,
                'error': str(e)
            }

    def evaluate(self) -> Dict[str, Any]:
        """Run authentication flow evaluation."""
        test_cases = self.load_test_cases()
        results = {
            'score': 0,
            'total': len(test_cases),
            'passed': 0,
            'failed': 0,
            'issues': [],
            'passed_tests': [],
            'failed_tests': []
        }

        if not test_cases:
            return results

        for test_case in test_cases:
            test_name = test_case['test_name']
            expected_status = test_case['expected_status']

            result = self.execute_request(test_case)
            actual_status = result['status']

            # Check if status matches expectation
            passed = actual_status == expected_status

            if passed:
                results['passed'] += 1
                results['passed_tests'].append(test_name)

                if self.verbose:
                    print(f"✓ Auth test passed: {test_name} (status {actual_status})")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': test_name,
                    'category': 'auth_flow',
                    'expected': f'Status {expected_status}',
                    'actual': f'Status {actual_status}',
                    'details': result.get('error', '')
                })

                results['issues'].append({
                    'severity': 'high',
                    'category': 'auth_flow',
                    'test': test_name,
                    'message': f"Expected status {expected_status} but got {actual_status}",
                    'recommendation': 'Review authentication endpoint validation'
                })

                if self.verbose:
                    print(f"✗ Auth test failed: {test_name} - Expected {expected_status}, got {actual_status}")

        # Calculate score
        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0

        return results


if __name__ == '__main__':
    import os
    from dotenv import load_dotenv

    load_dotenv()

    evaluator = AuthFlowEvaluator(
        backend_url=os.getenv('BACKEND_URL', 'http://localhost:4000'),
        verbose=os.getenv('VERBOSE', 'false').lower() == 'true',
        debug=os.getenv('DEBUG', 'false').lower() == 'true'
    )

    print("Running authentication flow evaluation...")
    results = evaluator.evaluate()

    print(f"\n{'='*60}")
    print(f"Authentication Flow Test Results")
    print(f"{'='*60}")
    print(f"Score: {results['score']}%")
    print(f"Passed: {results['passed']}/{results['total']}")
    print(f"Failed: {results['failed']}/{results['total']}")

    if results['issues']:
        print(f"\nIssues found:")
        for issue in results['issues']:
            print(f"  [{issue['severity'].upper()}] {issue['message']}")

    # Save results
    output_dir = Path('results')
    output_dir.mkdir(exist_ok=True)

    with open(output_dir / 'auth_flow.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to results/auth_flow.json")
