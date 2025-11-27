"""
Password strength validation evaluator.
Tests password validation rules and error messaging.
Follows Advancia Pay security best practices.
"""

import json
import jsonlines
import requests
from pathlib import Path
from typing import Dict, List, Any
from base_evaluator import BaseEvaluator


class PasswordStrengthEvaluator(BaseEvaluator):
    """Evaluates password strength validation implementation."""

    def __init__(
        self,
        backend_url: str,
        verbose: bool = False,
        debug: bool = False
    ):
        super().__init__(backend_url, verbose, debug)
        self.test_data_path = Path(__file__).parent.parent / \
            'data' / 'password_test_cases.jsonl'
        self.timeout = 10  # Request timeout in seconds

    def load_test_cases(self) -> List[Dict[str, Any]]:
        """Load password test cases from JSONL file."""
        if not self.test_data_path.exists():
            self.log_warning("Test data file not found, using defaults")
            return self.generate_default_test_cases()

        test_cases = []
        try:
            with jsonlines.open(self.test_data_path) as reader:
                for obj in reader:
                    test_cases.append(obj)
            self.log_info(f"Loaded {len(test_cases)} test cases")
        except Exception as e:
            self.log_error("Failed to load test cases", error=e)
            return self.generate_default_test_cases()

        return test_cases

    def generate_default_test_cases(self) -> List[Dict[str, Any]]:
        """Generate default password test cases (PCI-DSS patterns)."""
        return [
            {
                "password": "short",
                "should_accept": False,
                "reason": "Too short",
                "expected_error": "at least 12 characters"
            },
            {
                "password": "alllowercase123!",
                "should_accept": False,
                "reason": "No uppercase",
                "expected_error": "uppercase"
            },
            {
                "password": "ALLUPPERCASE123!",
                "should_accept": False,
                "reason": "No lowercase",
                "expected_error": "lowercase"
            },
            {
                "password": "NoNumbers!@#",
                "should_accept": False,
                "reason": "No numbers",
                "expected_error": "number"
            },
            {
                "password": "NoSpecialChar123",
                "should_accept": False,
                "reason": "No special char",
                "expected_error": "special character"
            },
            {
                "password": "Password123!",
                "should_accept": False,
                "reason": "Common password",
                "expected_error": "common"
            },
            {
                "password": "MyS3cur3P@ssw0rd!",
                "should_accept": True,
                "reason": "Strong password",
                "expected_error": None
            }
        ]

    def test_password(self, password: str) -> Dict[str, Any]:
        """Test a single password (no PII logged)."""
        # Generate non-PII test email
        test_email = f"test-{abs(hash(password)) % 10000}@eval.test"

        try:
            response = requests.post(
                f"{self.backend_url}/api/auth/signup",
                json={
                    "email": test_email,
                    "password": password,
                    "firstName": "Test",
                    "lastName": "User"
                },
                timeout=self.timeout
            )

            # Extract error safely
            error_msg = None
            if response.status_code >= 400:
                try:
                    body = response.json()
                    error_msg = body.get('error', '')
                    if isinstance(error_msg, dict):
                        error_msg = error_msg.get('message', str(error_msg))
                except Exception:
                    error_msg = "Unknown error"

            return {
                'status': response.status_code,
                'accepted': response.status_code in [200, 201],
                'error': error_msg
            }

        except requests.Timeout:
            self.log_error("Request timeout during password test")
            return {
                'status': 0,
                'accepted': False,
                'error': 'Request timeout'
            }
        except Exception as e:
            return self.handle_exception('password_test', e)

    def evaluate(self) -> Dict[str, Any]:
        """Run password strength evaluation with audit logging."""
        self.log_info("Starting password strength evaluation")

        test_cases = self.load_test_cases()
        results = {
            'score': 0,
            'total': len(test_cases),
            'passed': 0,
            'failed': 0,
            'issues': [],
            'passed_tests': [],
            'failed_tests': [],
            'audit_logs': []
        }

        for test_case in test_cases:
            reason = test_case['reason']
            password = test_case['password']
            should_accept = test_case['should_accept']

            self.log_debug(f"Testing: {reason}")

            result = self.test_password(password)

            # Check if result matches expectation
            passed = result['accepted'] == should_accept

            if passed:
                results['passed'] += 1
                results['passed_tests'].append(f"password_{reason.lower().replace(' ', '_')}")

                if self.verbose:
                    print(f"✓ Password test passed: {reason}")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': f"password_{reason.lower().replace(' ', '_')}",
                    'category': 'password_validation',
                    'expected': 'Accept' if should_accept else 'Reject',
                    'actual': 'Accepted' if result['accepted'] else 'Rejected',
                    'details': result.get('error', '')
                })

                results['issues'].append({
                    'severity': 'high' if should_accept else 'medium',
                    'category': 'password_validation',
                    'test': reason,
                    'message': f"Password '{password[:10]}...' {'should be accepted' if should_accept else 'should be rejected'} but was {'accepted' if result['accepted'] else 'rejected'}",
                    'recommendation': 'Review password validation rules'
                })

                if self.verbose:
                    print(f"✗ Password test failed: {reason} - {result.get('error', 'No error message')}")

        # Calculate score
        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0

        return results


if __name__ == '__main__':
    import os
    from dotenv import load_dotenv

    load_dotenv()

    evaluator = PasswordStrengthEvaluator(
        backend_url=os.getenv('BACKEND_URL', 'http://localhost:4000'),
        verbose=os.getenv('VERBOSE', 'false').lower() == 'true',
        debug=os.getenv('DEBUG', 'false').lower() == 'true'
    )

    print("Running password strength evaluation...")
    results = evaluator.evaluate()

    print(f"\n{'='*60}")
    print(f"Password Strength Test Results")
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

    with open(output_dir / 'password_strength.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to results/password_strength.json")
