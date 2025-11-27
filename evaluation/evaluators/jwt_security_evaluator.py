"""
JWT security evaluator.
Tests JWT token validation and security measures.
Follows Advancia Pay authentication security standards.
"""

import time
import requests
import jwt as pyjwt
from typing import Dict, Any, Optional
from base_evaluator import BaseEvaluator

class JWTSecurityEvaluator(BaseEvaluator):
    """Evaluates JWT token security implementation."""
    
    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        super().__init__(backend_url, verbose, debug)
        self.timeout = 10
    
    def create_valid_token(self) -> Optional[str]:
        """Create valid JWT token (token itself not logged)."""
        try:
            response = requests.post(
                f"{self.backend_url}/api/auth/signup",
                json={
                    "email": f"jwt-{int(time.time())}@eval.test",
                    "password": "JwtTest123!@#Secure",
                    "firstName": "JWT",
                    "lastName": "Test"
                },
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                token = response.json().get('token')
                self.log_debug("Valid JWT token created")
                return token
        except Exception as e:
            self.log_error("Failed to create valid JWT token", error=e)
        
        return None
    
    def test_no_token(self) -> Dict[str, Any]:
        """Test request without token."""
        try:
            response = requests.get(
                f"{self.backend_url}/api/users/profile",
                timeout=self.timeout
            )
            return {
                'status': response.status_code,
                'rejected': response.status_code == 401,
                'has_error': 'error' in response.json() if response.status_code >= 400 else False
            }
        except Exception as e:
            return self.handle_exception('no_token_test', e)

    def test_invalid_token(self) -> Dict[str, Any]:
        """Test request with invalid token."""
        try:
            response = requests.get(
                f"{self.backend_url}/api/users/profile",
                headers={'Authorization': 'Bearer invalid_token_string'},
                timeout=self.timeout
            )
            return {
                'status': response.status_code,
                'rejected': response.status_code == 403,
                'has_error': 'error' in response.json() if response.status_code >= 400 else False
            }
        except Exception as e:
            return {'status': 0, 'rejected': False, 'has_error': False, 'error': str(e)}

    def test_malformed_token(self) -> Dict[str, Any]:
        """Test request with malformed token."""
        try:
            response = requests.get(
                f"{self.backend_url}/api/users/profile",
                headers={'Authorization': 'Bearer not.a.jwt'},
                timeout=self.timeout
            )
            return {
                'status': response.status_code,
                'rejected': response.status_code in [401, 403],
                'has_error': 'error' in response.json() if response.status_code >= 400 else False
            }
        except Exception as e:
            return {'status': 0, 'rejected': False, 'has_error': False, 'error': str(e)}

    def test_valid_token(self, token: str) -> Dict[str, Any]:
        """Test request with valid token."""
        try:
            response = requests.get(
                f"{self.backend_url}/api/users/profile",
                headers={'Authorization': f'Bearer {token}'},
                timeout=self.timeout
            )
            return {
                'status': response.status_code,
                'accepted': response.status_code == 200,
                'has_data': bool(response.json()) if response.status_code == 200 else False
            }
        except Exception as e:
            return {'status': 0, 'accepted': False, 'has_data': False, 'error': str(e)}

    def test_token_structure(self, token: str) -> Dict[str, Any]:
        """Analyze token structure (without verification)."""
        try:
            # Decode without verification to check structure
            decoded = pyjwt.decode(token, options={"verify_signature": False})

            return {
                'has_parts': len(token.split('.')) == 3,
                'has_user_id': 'userId' in decoded or 'sub' in decoded,
                'has_expiry': 'exp' in decoded,
                'has_issued_at': 'iat' in decoded,
                'claims': list(decoded.keys())
            }
        except Exception as e:
            return {
                'has_parts': False,
                'has_user_id': False,
                'has_expiry': False,
                'has_issued_at': False,
                'claims': [],
                'error': str(e)
            }

    def evaluate(self) -> Dict[str, Any]:
        """Run JWT security evaluation with compliance tracking."""
        self.log_info("Starting JWT security evaluation")
        
        results = {
            'score': 0,
            'total': 5,
            'passed': 0,
            'failed': 0,
            'issues': [],
            'passed_tests': [],
            'failed_tests': [],
            'audit_logs': []
        }
        
        valid_token = self.create_valid_token()
        if not valid_token:
            results['issues'].append({
                'severity': 'critical',
                'category': 'jwt_security',
                'test': 'token_creation',
                'message': 'Failed to create JWT token',
                'recommendation': 'Check auth endpoint and JWT_SECRET'
            })
            return results

        # Test 1: No token rejected
        no_token_result = self.test_no_token()
        if no_token_result['rejected']:
            results['passed'] += 1
            results['passed_tests'].append('no_token_rejected')
            if self.verbose:
                print("✓ Requests without token properly rejected (401)")
        else:
            results['failed'] += 1
            results['failed_tests'].append({
                'name': 'no_token_rejected',
                'category': 'jwt_security',
                'expected': '401 Unauthorized',
                'actual': f"Status {no_token_result['status']}",
                'details': 'Missing token should return 401'
            })
            results['issues'].append({
                'severity': 'critical',
                'category': 'jwt_security',
                'test': 'no_token',
                'message': 'Protected endpoint accessible without token',
                'recommendation': 'Implement authenticateToken middleware'
            })
            if self.verbose:
                print(f"✗ No token not rejected (status: {no_token_result['status']})")

        # Test 2: Invalid token rejected
        invalid_token_result = self.test_invalid_token()
        if invalid_token_result['rejected']:
            results['passed'] += 1
            results['passed_tests'].append('invalid_token_rejected')
            if self.verbose:
                print("✓ Invalid tokens properly rejected (403)")
        else:
            results['failed'] += 1
            results['failed_tests'].append({
                'name': 'invalid_token_rejected',
                'category': 'jwt_security',
                'expected': '403 Forbidden',
                'actual': f"Status {invalid_token_result['status']}",
                'details': 'Invalid token should return 403'
            })
            results['issues'].append({
                'severity': 'critical',
                'category': 'jwt_security',
                'test': 'invalid_token',
                'message': 'Invalid JWT tokens not properly rejected',
                'recommendation': 'Verify JWT signature validation'
            })
            if self.verbose:
                print(f"✗ Invalid token not rejected (status: {invalid_token_result['status']})")

        # Test 3: Malformed token rejected
        malformed_result = self.test_malformed_token()
        if malformed_result['rejected']:
            results['passed'] += 1
            results['passed_tests'].append('malformed_token_rejected')
            if self.verbose:
                print("✓ Malformed tokens properly rejected")
        else:
            results['failed'] += 1
            results['failed_tests'].append({
                'name': 'malformed_token_rejected',
                'category': 'jwt_security',
                'expected': '401 or 403',
                'actual': f"Status {malformed_result['status']}",
                'details': 'Malformed token should be rejected'
            })
            results['issues'].append({
                'severity': 'high',
                'category': 'jwt_security',
                'test': 'malformed_token',
                'message': 'Malformed JWT tokens not rejected',
                'recommendation': 'Add token format validation'
            })
            if self.verbose:
                print(f"✗ Malformed token not rejected (status: {malformed_result['status']})")

        # Test 4: Valid token accepted
        valid_result = self.test_valid_token(valid_token)
        if valid_result['accepted']:
            results['passed'] += 1
            results['passed_tests'].append('valid_token_accepted')
            if self.verbose:
                print("✓ Valid tokens properly accepted")
        else:
            results['failed'] += 1
            results['failed_tests'].append({
                'name': 'valid_token_accepted',
                'category': 'jwt_security',
                'expected': '200 OK',
                'actual': f"Status {valid_result['status']}",
                'details': 'Valid token should be accepted'
            })
            results['issues'].append({
                'severity': 'high',
                'category': 'jwt_security',
                'test': 'valid_token',
                'message': 'Valid JWT token rejected',
                'recommendation': 'Check JWT verification logic'
            })
            if self.verbose:
                print(f"✗ Valid token rejected (status: {valid_result['status']})")

        # Test 5: Token structure
        structure = self.test_token_structure(valid_token)
        structure_valid = (
            structure['has_parts'] and
            structure['has_user_id'] and
            structure['has_expiry']
        )

        if structure_valid:
            results['passed'] += 1
            results['passed_tests'].append('token_structure_valid')
            if self.verbose:
                print(f"✓ Token structure valid (claims: {', '.join(structure['claims'])})")
        else:
            results['failed'] += 1
            missing = []
            if not structure['has_parts']:
                missing.append('3 parts')
            if not structure['has_user_id']:
                missing.append('userId/sub')
            if not structure['has_expiry']:
                missing.append('exp')

            results['failed_tests'].append({
                'name': 'token_structure_valid',
                'category': 'jwt_security',
                'expected': 'JWT with userId and exp claims',
                'actual': f"Missing: {', '.join(missing)}",
                'details': f"Claims found: {structure.get('claims', [])}"
            })
            results['issues'].append({
                'severity': 'medium',
                'category': 'jwt_security',
                'test': 'token_structure',
                'message': f"JWT token missing required claims: {', '.join(missing)}",
                'recommendation': 'Include userId and exp in JWT payload'
            })
            if self.verbose:
                print(f"✗ Token structure incomplete: missing {', '.join(missing)}")

        # Calculate score
        results['score'] = round((results['passed'] / results['total']) * 100, 1) if results['total'] > 0 else 0

        self.log_info(
            "JWT security evaluation complete",
            score=results['score'],
            passed=results['passed'],
            failed=results['failed']
        )
        
        return results
