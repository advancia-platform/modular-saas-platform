"""
Account lockout evaluator.
Tests account lockout mechanism after failed login attempts.
Follows Advancia Pay PCI-DSS requirements.
"""

import time
import requests
from typing import Dict, Any
from base_evaluator import BaseEvaluator

class AccountLockoutEvaluator(BaseEvaluator):
    """Evaluates account lockout implementation per fintech standards."""
    
    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        super().__init__(backend_url, verbose, debug)
        self.max_attempts = 5  # PCI-DSS requirement
        self.lockout_duration_minutes = 15
        self.timeout = 10
    
    def create_test_user(self) -> Dict[str, str]:
        """Create a test user for lockout testing (no PII logged)."""
        test_email = f"lockout-{int(time.time())}@eval.test"
        test_password = "SecureLockoutTest123!@#"
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/auth/signup",
                json={
                    "email": test_email,
                    "password": test_password,
                    "firstName": "Lockout",
                    "lastName": "Test"
                },
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                self.log_debug("Test user created for lockout evaluation")
                return {"email": test_email, "password": test_password}
        except Exception as e:
            self.log_error("Failed to create lockout test user", error=e)
        
        return {}
    
    def test_failed_login_attempts(self, email: str, wrong_password: str = "WrongPassword123!") -> Dict[str, Any]:
        """Test multiple failed login attempts (email redacted in logs)."""
        results = {
            'attempts': 0,
            'lockout_triggered': False,
            'lockout_at_attempt': 0,
            'status_codes': [],
            'error_codes': [],
            'retry_after_provided': False
        }
        
        for attempt in range(self.max_attempts + 2):
            try:
                response = requests.post(
                    f"{self.backend_url}/api/auth/login",
                    json={"email": email, "password": wrong_password},
                    timeout=self.timeout
                )
                
                results['attempts'] += 1
                results['status_codes'].append(response.status_code)
                
                if response.status_code == 429:
                    results['lockout_triggered'] = True
                    results['lockout_at_attempt'] = attempt + 1
                    
                    try:
                        body = response.json()
                        error_code = body.get('code') or body.get('error')
                        results['error_codes'].append(error_code)
                        
                        if 'retryAfter' in body or 'retry-after' in response.headers:
                            results['retry_after_provided'] = True
                    except:
                        pass
                    
                    self.log_debug(f"Lockout triggered at attempt {attempt + 1}")
                    break
                
                time.sleep(0.2)
                
            except requests.Timeout:
                self.log_error(f"Timeout during lockout test attempt {attempt + 1}")
                break
            except Exception as e:
                self.log_error("Error during failed login attempt", error=e)
                break
        
        return results
    
    def test_lockout_reset(self, email: str, correct_password: str) -> bool:
        """Test if lockout resets after successful login."""
        # Wait a moment
        time.sleep(1)

        try:
            response = requests.post(
                f"{self.backend_url}/api/auth/login",
                json={"email": email, "password": correct_password},
                timeout=self.timeout
            )

            # If still locked, return False
            if response.status_code == 429:
                return False

            # If successful login, check if we can login again
            if response.status_code == 200:
                time.sleep(0.5)
                response2 = requests.post(
                    f"{self.backend_url}/api/auth/login",
                    json={"email": email, "password": correct_password},
                    timeout=self.timeout
                )
                return response2.status_code == 200

        except Exception as e:
            if self.debug:
                print(f"Error testing lockout reset: {e}")

        return False

    def evaluate(self) -> Dict[str, Any]:
        """Run account lockout evaluation with PCI-DSS compliance checks."""
        self.log_info("Starting account lockout evaluation")
        
        results = {
            'score': 0,
            'total': 4,
            'passed': 0,
            'failed': 0,
            'issues': [],
            'passed_tests': [],
            'failed_tests': [],
            'audit_logs': []
        }
        
        # Create test user
        user = self.create_test_user()
        if not user:
            results['issues'].append({
                'severity': 'critical',
                'category': 'account_lockout',
                'test': 'user_creation',
                'message': 'Failed to create test user',
                'recommendation': 'Verify backend connectivity and signup endpoint'
            })
            return results
        
        # Test 1: Lockout triggers
        lockout_result = self.test_failed_login_attempts(user['email'])
        
        audit_entry = self.create_audit_log_entry(
            action='account_lockout_trigger_test',
            result='passed' if lockout_result['lockout_triggered'] else 'failed',
            details={
                'attempts': lockout_result['attempts'],
                'lockout_triggered': lockout_result['lockout_triggered']
            }
        )
        results['audit_logs'].append(audit_entry)
        
        if lockout_result['lockout_triggered']:
            results['passed'] += 1
            results['passed_tests'].append('lockout_triggers')
            self.log_info(f"✓ Lockout triggered after {lockout_result['lockout_at_attempt']} attempts")
        else:
            results['failed'] += 1
            results['failed_tests'].append({
                'name': 'lockout_triggers',
                'category': 'account_lockout',
                'expected': 'Account locked after failed attempts',
                'actual': f"No lockout after {lockout_result['attempts']} attempts",
                'details': 'PCI-DSS requirement not met'
            })
            results['issues'].append({
                'severity': 'critical',
                'category': 'account_lockout',
                'test': 'lockout_triggers',
                'message': f"Account lockout NOT triggered after {lockout_result['attempts']} attempts",
                'recommendation': 'Implement account lockout per PCI-DSS Requirement 8.2.4'
            })
            self.log_error(f"✗ No lockout after {lockout_result['attempts']} attempts")
        
        # Test 2: Lockout at correct attempt number
        if lockout_result['lockout_triggered']:
            attempts_correct = lockout_result['lockout_at_attempt'] <= self.max_attempts
            if attempts_correct:
                results['passed'] += 1
                results['passed_tests'].append('lockout_at_correct_attempt')
                self.log_info(f"✓ Lockout occurred at attempt {lockout_result['lockout_at_attempt']} (expected ≤{self.max_attempts})")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': 'lockout_at_correct_attempt',
                    'category': 'account_lockout',
                    'expected': f"Lockout at attempt {self.max_attempts}",
                    'actual': f"Lockout at attempt {lockout_result['lockout_at_attempt']}",
                    'details': 'Lockout threshold too high'
                })
                results['issues'].append({
                    'severity': 'medium',
                    'category': 'account_lockout',
                    'test': 'lockout_threshold',
                    'message': f"Lockout triggered at attempt {lockout_result['lockout_at_attempt']} (expected {self.max_attempts})",
                    'recommendation': 'Adjust lockout threshold configuration'
                })
                self.log_warning(f"✗ Lockout at attempt {lockout_result['lockout_at_attempt']} (expected {self.max_attempts})")

        # Test 3: Proper error code returned
        if lockout_result['lockout_triggered']:
            has_lockout_code = any('ACCOUNT_LOCKED' in str(code) for code in lockout_result['error_codes'])
            if has_lockout_code:
                results['passed'] += 1
                results['passed_tests'].append('lockout_error_code')
                self.log_info("✓ Proper ACCOUNT_LOCKED error code returned")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': 'lockout_error_code',
                    'category': 'account_lockout',
                    'expected': 'Error code: ACCOUNT_LOCKED',
                    'actual': f"Error codes: {lockout_result['error_codes']}",
                    'details': 'Missing proper error code'
                })
                results['issues'].append({
                    'severity': 'low',
                    'category': 'account_lockout',
                    'test': 'error_code',
                    'message': 'ACCOUNT_LOCKED error code not returned',
                    'recommendation': 'Return specific error code for locked accounts'
                })
                self.log_warning(f"✗ Missing ACCOUNT_LOCKED error code: {lockout_result['error_codes']}")

        # Test 4: Retry-after provided
        if lockout_result['lockout_triggered']:
            if lockout_result['retry_after_provided']:
                results['passed'] += 1
                results['passed_tests'].append('retry_after_provided')
                self.log_info("✓ Retry-after information provided")
            else:
                results['failed'] += 1
                results['failed_tests'].append({
                    'name': 'retry_after_provided',
                    'category': 'account_lockout',
                    'expected': 'retryAfter field in response',
                    'actual': 'No retryAfter information',
                    'details': 'Missing retry timing information'
                })
                results['issues'].append({
                    'severity': 'low',
                    'category': 'account_lockout',
                    'test': 'retry_after',
                    'message': 'No retry-after information provided in lockout response',
                    'recommendation': 'Include retryAfter timestamp in lockout response'
                })
                self.log_warning("✗ No retry-after information provided")

        # Calculate score
        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0
        
        self.log_info(
            "Account lockout evaluation complete",
            score=results['score'],
            passed=results['passed'],
            failed=results['failed']
        )
        
        return results
