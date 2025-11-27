"""
Custom code-based evaluator for password strength validation
Tests the password validation logic against expected security requirements
"""

class PasswordStrengthEvaluator:
    """
    Evaluates password strength validation accuracy.

    Tests whether passwords are correctly accepted/rejected based on:
    - Length requirements (minimum 12 characters)
    - Complexity requirements (uppercase, lowercase, numbers, special chars)
    - Common password blocking
    """

    def __init__(self):
        """Initialize the password strength evaluator"""
        pass

    def __call__(
        self,
        *,
        password: str,
        expected_valid: bool,
        expected_error: str = None,
        actual_response: dict = None,
        **kwargs
    ) -> dict:
        """
        Evaluate password strength validation.

        Args:
            password: The password being tested
            expected_valid: Whether password should be accepted
            expected_error: Expected error type (length, uppercase, lowercase, number, special, common)
            actual_response: Actual API response from signup/validation

        Returns:
            Dictionary with evaluation metrics
        """
        result = {
            "password_length": len(password),
            "expected_valid": expected_valid,
            "validation_correct": False,
            "error_message_quality": 0,
            "security_appropriate": True
        }

        if actual_response is None:
            result["error"] = "No actual response provided"
            return result

        # Check if validation result matches expectation
        actual_valid = actual_response.get("success", False)
        result["actual_valid"] = actual_valid
        result["validation_correct"] = (actual_valid == expected_valid)

        # If password should be rejected, check error quality
        if not expected_valid:
            error_msg = actual_response.get("error", "")
            details = actual_response.get("details", [])

            # Score error message quality (1-5)
            quality_score = 1

            if error_msg:
                quality_score = 2

                # Check if message is helpful
                if any(word in error_msg.lower() for word in ["security", "requirements", "strength", "password"]):
                    quality_score = 3

                # Check if details are provided
                if details and isinstance(details, list) and len(details) > 0:
                    quality_score = 4

                # Check if details match expected error
                if expected_error and any(expected_error in str(detail).lower() for detail in details):
                    quality_score = 5

            result["error_message_quality"] = quality_score
            result["error_details_provided"] = len(details) if details else 0

            # Check for information leakage (security concern)
            sensitive_patterns = ["database", "internal", "stack trace", "exception"]
            if any(pattern in error_msg.lower() for pattern in sensitive_patterns):
                result["security_appropriate"] = False
                result["security_issue"] = "Error message contains sensitive information"

        # If password should be accepted, verify token was provided
        if expected_valid and actual_valid:
            has_token = "token" in actual_response or "accessToken" in actual_response.get("tokens", {})
            result["token_provided"] = has_token
            if not has_token:
                result["validation_correct"] = False
                result["issue"] = "Password accepted but no token provided"

        return result


class AccountLockoutEvaluator:
    """
    Evaluates account lockout mechanism effectiveness.

    Tests whether:
    - Account locks after maximum failed attempts
    - Lockout duration is appropriate
    - Lockout resets on successful login
    """

    def __init__(self, max_attempts: int = 5, lockout_duration_minutes: int = 15):
        """
        Initialize account lockout evaluator.

        Args:
            max_attempts: Maximum failed attempts before lockout (default: 5)
            lockout_duration_minutes: Expected lockout duration (default: 15)
        """
        self.max_attempts = max_attempts
        self.lockout_duration_minutes = lockout_duration_minutes

    def __call__(
        self,
        *,
        test_email: str,
        attempts: list,
        **kwargs
    ) -> dict:
        """
        Evaluate account lockout mechanism.

        Args:
            test_email: Email address being tested
            attempts: List of login attempt responses

        Returns:
            Dictionary with lockout evaluation metrics
        """
        result = {
            "test_email": test_email,
            "total_attempts": len(attempts),
            "lockout_triggered": False,
            "attempts_before_lockout": 0,
            "lockout_status_code": None,
            "lockout_code_present": False,
            "retry_after_provided": False,
            "duration_minutes_provided": None,
            "duration_correct": False,
            "error_message_quality": 0
        }

        # Analyze attempts to find lockout
        lockout_found = False
        for i, attempt in enumerate(attempts):
            status_code = attempt.get("status_code")
            error = attempt.get("error", {})

            # Check if this is a lockout response
            if status_code == 429:
                lockout_found = True
                result["lockout_triggered"] = True
                result["attempts_before_lockout"] = i
                result["lockout_status_code"] = status_code

                # Check for lockout code
                if error.get("code") == "ACCOUNT_LOCKED":
                    result["lockout_code_present"] = True

                # Check for retry-after information
                if "retryAfter" in error or "retry_after" in error:
                    result["retry_after_provided"] = True
                    retry_after = error.get("retryAfter") or error.get("retry_after")

                    # Convert to minutes if in seconds
                    if retry_after:
                        minutes = retry_after / 60 if retry_after > 100 else retry_after
                        result["duration_minutes_provided"] = minutes

                        # Check if duration is correct (within 1 minute tolerance)
                        if abs(minutes - self.lockout_duration_minutes) <= 1:
                            result["duration_correct"] = True

                # Check error message quality
                error_msg = error.get("error", "")
                if error_msg:
                    quality = 1
                    if "locked" in error_msg.lower():
                        quality = 3
                    if "attempts" in error_msg.lower() or "failed" in error_msg.lower():
                        quality = 4
                    if "minutes" in error_msg.lower() or "try again" in error_msg.lower():
                        quality = 5
                    result["error_message_quality"] = quality

                break

        # Check if lockout happened at the right time
        if lockout_found:
            expected_lockout_at = self.max_attempts
            actual_lockout_at = result["attempts_before_lockout"]

            # Lockout should happen after max_attempts or on the (max_attempts + 1)th attempt
            if actual_lockout_at <= expected_lockout_at + 1:
                result["lockout_timing_correct"] = True
            else:
                result["lockout_timing_correct"] = False
                result["issue"] = f"Lockout at attempt {actual_lockout_at}, expected around {expected_lockout_at}"
        else:
            result["issue"] = f"No lockout detected after {len(attempts)} attempts"

        return result
