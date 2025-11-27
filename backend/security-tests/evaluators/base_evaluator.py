"""
Base evaluator class with logging, error handling, and security patterns.
Follows Advancia Pay fintech security best practices.
"""

import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging following Winston-style structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class BaseEvaluator:
    """Base class for all security evaluators with built-in best practices."""

    def __init__(
        self,
        backend_url: str,
        verbose: bool = False,
        debug: bool = False
    ):
        self.backend_url = backend_url
        self.verbose = verbose
        self.debug = debug
        self.timeout = 10  # Match Advancia Pay patterns
        self.logger = logging.getLogger(self.__class__.__name__)

        # Set log level based on flags
        if debug:
            self.logger.setLevel(logging.DEBUG)
        elif verbose:
            self.logger.setLevel(logging.INFO)
        else:
            self.logger.setLevel(logging.WARNING)

        # Verify backend is accessible on init
        self._verify_backend_connection()

    def _verify_backend_connection(self):
        """Verify backend is reachable before running tests."""
        import requests
        try:
            response = requests.get(
                f"{self.backend_url}/health",
                timeout=5
            )
            if response.status_code != 200:
                self.log_warning(
                    f"Backend health check returned {response.status_code}"
                )
        except requests.RequestException as e:
            self.log_error(
                f"Cannot connect to backend at {self.backend_url}",
                error=str(e)
            )
            raise ConnectionError(
                f"Backend not accessible at {self.backend_url}. "
                f"Start it with: cd backend && npm run dev"
            )

    def log_info(self, message: str, **kwargs):
        """Log informational message (PII-safe)."""
        safe_kwargs = self._sanitize_log_data(kwargs)
        self.logger.info(message, extra=safe_kwargs)

    def log_warning(self, message: str, **kwargs):
        """Log warning message (PII-safe)."""
        safe_kwargs = self._sanitize_log_data(kwargs)
        self.logger.warning(message, extra=safe_kwargs)

    def log_error(
        self,
        message: str,
        error: Optional[Exception] = None,
        **kwargs
    ):
        """Log error message without exposing secrets."""
        safe_kwargs = self._sanitize_log_data(kwargs)
        if error:
            # Don't log full stack traces with sensitive data
            safe_kwargs['error_type'] = type(error).__name__
            if self.debug:
                safe_kwargs['error_message'] = str(error)
        self.logger.error(message, extra=safe_kwargs)

    def log_debug(self, message: str, **kwargs):
        """Log debug message (development only)."""
        if self.debug:
            safe_kwargs = self._sanitize_log_data(kwargs)
            self.logger.debug(message, extra=safe_kwargs)

    def _sanitize_log_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from logs (PII, secrets, tokens)."""
        sensitive_keys = [
            'password', 'token', 'secret', 'api_key', 'auth',
            'authorization', 'jwt', 'session', 'cookie',
            'credit_card', 'ssn', 'email', 'phone'
        ]

        sanitized = {}
        for key, value in data.items():
            key_lower = key.lower()

            # Redact sensitive keys
            if any(s in key_lower for s in sensitive_keys):
                sanitized[key] = '[REDACTED]'
            # Redact if value looks like token/secret
            elif isinstance(value, str) and len(value) > 32 and \
                    value.isalnum():
                sanitized[key] = f"[REDACTED:{len(value)} chars]"
            else:
                sanitized[key] = value

        return sanitized

    def create_audit_log_entry(
        self,
        action: str,
        result: str,
        details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create audit log entry for compliance tracking."""
        return {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'evaluator': self.__class__.__name__,
            'action': action,
            'result': result,
            'backend_url': self.backend_url,
            'details': self._sanitize_log_data(details)
        }

    def handle_exception(
        self,
        operation: str,
        error: Exception
    ) -> Dict[str, Any]:
        """Centralized exception handling following backend patterns."""
        error_type = type(error).__name__

        # Log error without exposing sensitive details
        self.log_error(
            f"Error during {operation}",
            error=error,
            operation=operation
        )

        # Return safe error response
        return {
            'success': False,
            'error': f"Evaluation error during {operation}",
            'error_type': error_type,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

    def validate_response(
        self,
        response,
        expected_status: int = 200
    ) -> bool:
        """Validate HTTP response following security best practices."""
        if not response:
            self.log_error("Received null response")
            return False

        # Check for expected status
        if hasattr(response, 'status_code'):
            status_ok = response.status_code == expected_status
            if not status_ok:
                self.log_warning(
                    "Unexpected status code",
                    expected=expected_status,
                    actual=response.status_code
                )
            return status_ok

        return True

    def evaluate(self) -> Dict[str, Any]:
        """Override this method in subclasses."""
        raise NotImplementedError("Subclasses must implement evaluate()")
