"""
Rate limiting evaluator.
Tests rate limiting enforcement on sensitive endpoints.
"""

import json
import time
import jsonlines
import requests
from pathlib import Path
from typing import Dict, List, Any

class RateLimitEvaluator:
    """Evaluates rate limiting implementation."""

    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        self.backend_url = backend_url
        self.verbose = verbose
        self.debug = debug
        self.test_data_path = Path(__file__).parent.parent / 'data' / 'rate_limit_test_cases.jsonl'

    def load_test_cases(self) -> List[Dict[str, Any]]:
        """Load rate limit test cases from JSONL file."""
        test_cases = []
        if self.test_data_path.exists():
            with jsonlines.open(self.test_data_path) as reader:
                for obj in reader:
                    test_cases.append(obj)
        return test_cases

    def test_rate_limit(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """Test rate limiting on a specific endpoint."""
        endpoint = f"{self.backend_url}{test_case['endpoint']}"
        method = test_case['method'].lower()
        limit = test_case['limit']
        payload = test_case.get('payload', {})

        results = {
            'requests_made': 0,
            'blocked_at': None,
            'rate_limit_working': False
        }

        try:
            # Make requests up to limit + 2
            for i in range(limit + 2):
                if method == 'post':
                    # Use unique email for each request to avoid duplicate errors
                    test_payload = payload.copy()
                    if 'email' in test_payload:
                        test_payload['email'] = f"ratelimit{i}@example.com"
                    response = requests.post(endpoint, json=test_payload, timeout=5)
                elif method == 'get':
                    response = requests.get(endpoint, params=payload, timeout=5)
                else:
                    break

                results['requests_made'] += 1

                # Check if rate limited (429 status)
                if response.status_code == 429:
                    results['blocked_at'] = i + 1
                    results['rate_limit_working'] = True
                    break

                # Small delay between requests
                time.sleep(0.1)

            # If we made more than limit requests without 429, rate limiting failed
            if results['requests_made'] > limit and not results['rate_limit_working']:
                results['rate_limit_working'] = False

        except Exception as e:
            results['error'] = str(e)

        return results

    def evaluate(self) -> Dict[str, Any]:
        """Run rate limiting evaluation."""
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
            description = test_case['description']
            endpoint = test_case['endpoint']
            limit = test_case['limit']

            if self.verbose:
                print(f"Testing: {description} (limit: {limit} requests)")

            result = self.test_rate_limit(test_case)

            if result['rate_limit_working']:
                results['passed'] += 1
                results['passed_tests'].append(description)

                if self.verbose:
                    print(f"✓ Rate limit working: Blocked at request {result['blocked_at']}")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': description,
                    'category': 'rate_limiting',
                    'expected': f'Rate limited after {limit} requests',
                    'actual': f'Made {result["requests_made"]} requests without rate limiting',
                    'details': result.get('error', '')
                })

                results['issues'].append({
                    'severity': 'high',
                    'category': 'rate_limiting',
                    'test': description,
                    'message': f"Rate limiting not working on {endpoint} (made {result['requests_made']} requests, expected limit at {limit})",
                    'recommendation': 'Implement or fix rate limiting middleware'
                })

                if self.verbose:
                    print(f"✗ Rate limit NOT working: Made {result['requests_made']} requests without 429")

        # Calculate score
        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0

        return results


if __name__ == '__main__':
    import os
    from dotenv import load_dotenv

    load_dotenv()

    evaluator = RateLimitEvaluator(
        backend_url=os.getenv('BACKEND_URL', 'http://localhost:4000'),
        verbose=os.getenv('VERBOSE', 'false').lower() == 'true',
        debug=os.getenv('DEBUG', 'false').lower() == 'true'
    )

    print("Running rate limiting evaluation...")
    results = evaluator.evaluate()

    print(f"\n{'='*60}")
    print(f"Rate Limiting Test Results")
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

    with open(output_dir / 'rate_limiting.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to results/rate_limiting.json")
