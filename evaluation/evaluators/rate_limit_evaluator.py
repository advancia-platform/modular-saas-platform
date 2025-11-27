"""
Rate limiting evaluator.
Tests rate limit enforcement across different endpoints.
Follows Advancia Pay fintech security best practices.
"""

import time
import jsonlines
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from base_evaluator import BaseEvaluator


class RateLimitEvaluator(BaseEvaluator):
    """Evaluates rate limiting implementation."""

    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        super().__init__(backend_url, verbose, debug)
        self.test_data_path = Path(__file__).parent.parent / 'data' / 'rate_limit_test_cases.jsonl'
        self.timeout = 10

    def load_test_cases(self) -> List[Dict[str, Any]]:
        """Load rate limit test cases."""
        if not self.test_data_path.exists():
            self.log_warning("Rate limit test data not found, using defaults")
            return self.generate_default_test_cases()

        test_cases = []
        try:
            with jsonlines.open(self.test_data_path) as reader:
                for obj in reader:
                    test_cases.append(obj)
            self.log_info(f"Loaded {len(test_cases)} rate limit test cases")
        except Exception as e:
            self.log_error("Failed to load rate limit test cases", error=e)
            return self.generate_default_test_cases()

        return test_cases

    def generate_default_test_cases(self) -> List[Dict[str, Any]]:
        """Generate default rate limit test cases per backend config."""
        return [
            {
                "endpoint": "/api/auth/login",
                "method": "POST",
                "limit": 5,
                "window_seconds": 900,
                "description": "Login rate limit",
                "requires_auth": False,
                "payload": {"email": "test@example.com", "password": "WrongPass123!"}
            },
            {
                "endpoint": "/api/auth/signup",
                "method": "POST",
                "limit": 3,
                "window_seconds": 3600,
                "description": "Signup rate limit",
                "requires_auth": False,
                "payload": {
                    "email": "test@example.com",
                    "password": "Test123!@#Secure",
                    "firstName": "Test",
                    "lastName": "User"
                }
            }
        ]

    def test_rate_limit(self, test_case: Dict[str, Any], auth_token: Optional[str] = None) -> Dict[str, Any]:
        """Test rate limit for a specific endpoint (no sensitive data logged)."""
        endpoint = test_case['endpoint']
        method = test_case['method']
        expected_limit = test_case['limit']
        payload = test_case.get('payload', {})

        results = {
            'rate_limited': False,
            'requests_before_limit': 0,
            'expected_limit': expected_limit,
            'status_codes': [],
            'retry_after_provided': False
        }

        headers = {'Content-Type': 'application/json'}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        max_attempts = expected_limit + 5

        for i in range(max_attempts):
            try:
                if method == 'POST':
                    response = requests.post(
                        f"{self.backend_url}{endpoint}",
                        json=payload,
                        headers=headers,
                        timeout=self.timeout
                    )
                elif method == 'GET':
                    response = requests.get(
                        f"{self.backend_url}{endpoint}",
                        headers=headers,
                        timeout=self.timeout
                    )
                else:
                    continue

                results['status_codes'].append(response.status_code)

                if response.status_code == 429:
                    results['rate_limited'] = True
                    results['requests_before_limit'] = i

                    # Check for retry-after (Winston logs: structured data)
                    if 'retry-after' in response.headers or 'Retry-After' in response.headers:
                        results['retry_after_provided'] = True

                    try:
                        body = response.json()
                        if 'retryAfter' in body:
                            results['retry_after_provided'] = True
                    except:
                        pass

                    self.log_debug(f"Rate limit triggered at request {i}")
                    break

                time.sleep(0.1)

            except requests.Timeout:
                self.log_error(f"Timeout on rate limit test attempt {i}")
                break
            except Exception as e:
                self.log_error(f"Error during rate limit test", error=e)
                break

        return results

    def create_auth_token(self) -> Optional[str]:
        """Create auth token for protected endpoint tests (no PII logged)."""
        try:
            test_email = f"ratelimit-{int(time.time())}@eval.test"
            response = requests.post(
                f"{self.backend_url}/api/auth/signup",
                json={
                    "email": test_email,
                    "password": "SecureTest123!@#",
                    "firstName": "Rate",
                    "lastName": "Test"
                },
                timeout=self.timeout
            )

            if response.status_code in [200, 201]:
                return response.json().get('token')

        except Exception as e:
            self.log_error("Failed to create auth token for rate limit tests", error=e)

        return None

    def evaluate(self) -> Dict[str, Any]:
        """Run rate limit evaluation with audit logging."""
        self.log_info("Starting rate limit evaluation")

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

        auth_token = self.create_auth_token()

        for test_case in test_cases:
            description = test_case['description']
            expected_limit = test_case['limit']
            requires_auth = test_case.get('requires_auth', False)

            if requires_auth and not auth_token:
                self.log_warning(f"Skipping {description} - auth required but no token")
                continue

            self.log_debug(f"Testing rate limit: {description}")

            result = self.test_rate_limit(
                test_case,
                auth_token if requires_auth else None
            )

            # Audit log entry
            audit_entry = self.create_audit_log_entry(
                action=f"rate_limit_{description.lower().replace(' ', '_')}",
                result='passed' if result['rate_limited'] else 'failed',
                details={
                    'expected_limit': expected_limit,
                    'requests_before_limit': result['requests_before_limit'],
                    'rate_limited': result['rate_limited']
                }
            )
            results['audit_logs'].append(audit_entry)

            if result['rate_limited']:
                requests_made = result['requests_before_limit']
                within_tolerance = abs(requests_made - expected_limit) <= 1

                if within_tolerance and result['retry_after_provided']:
                    results['passed'] += 1
                    results['passed_tests'].append(f"rate_limit_{description.lower().replace(' ', '_')}")
                    self.log_info(f"✓ {description} passed (limited at {requests_made})")
                else:
                    results['failed'] += 1

                    issue_msg = f"Rate limit for {description}"
                    if not within_tolerance:
                        issue_msg += f" enforced at {requests_made} (expected {expected_limit})"
                    if not result['retry_after_provided']:
                        issue_msg += " - missing retryAfter"

                    results['failed_tests'].append({
                        'name': f"rate_limit_{description.lower().replace(' ', '_')}",
                        'category': 'rate_limiting',
                        'expected': f"Limit at {expected_limit} with retryAfter",
                        'actual': f"Limited at {requests_made}, retryAfter: {result['retry_after_provided']}",
                        'details': issue_msg
                    })

                    results['issues'].append({
                        'severity': 'medium' if within_tolerance else 'high',
                        'category': 'rate_limiting',
                        'test': description,
                        'message': issue_msg,
                        'recommendation': 'Review rate limiting config in backend/src/middleware/rateLimiter.ts'
                    })

                    self.log_warning(f"✗ {issue_msg}")
            else:
                results['failed'] += 1

                results['failed_tests'].append({
                    'name': f"rate_limit_{description.lower().replace(' ', '_')}",
                    'category': 'rate_limiting',
                    'expected': f"Rate limited at {expected_limit}",
                    'actual': 'No rate limiting enforced',
                    'details': f"Made {len(result['status_codes'])} requests without limit"
                })

                results['issues'].append({
                    'severity': 'critical',
                    'category': 'rate_limiting',
                    'test': description,
                    'message': f"Rate limit NOT enforced for {description}",
                    'recommendation': 'Implement rate limiting middleware per PCI-DSS requirements'
                })

                self.log_error(f"✗ {description} - no rate limiting detected")

        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0

        self.log_info(
            "Rate limit evaluation complete",
            score=results['score'],
            passed=results['passed'],
            failed=results['failed']
        )

        return results
