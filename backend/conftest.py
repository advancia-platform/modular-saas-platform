"""
Pytest configuration and fixtures for the backend API tests.

This module provides shared fixtures and configuration for all test modules.
"""

import os
import sys
from typing import Dict, Any, Generator
import pytest
import requests
from dataclasses import dataclass

# Add the src directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

@dataclass
class TestConfig:
    """Test configuration with all necessary URLs and timeouts."""
    base_url: str = os.getenv("BASE_URL", "http://localhost:4000")
    timeout: int = int(os.getenv("TEST_TIMEOUT", "30"))
    admin_token: str = os.getenv("ADMIN_TOKEN", "")
    auditor_token: str = os.getenv("AUDITOR_TOKEN", "")
    viewer_token: str = os.getenv("VIEWER_TOKEN", "")
    user_token: str = os.getenv("USER_TOKEN", "")

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.base_url:
            raise ValueError("BASE_URL environment variable is required")

@dataclass
class TestTokens:
    """Container for all authentication tokens used in testing."""
    admin_token: str = ""
    auditor_token: str = ""
    viewer_token: str = ""
    user_token: str = ""

@pytest.fixture(scope="session")
def test_config() -> TestConfig:
    """Provide test configuration for all tests."""
    return TestConfig()

@pytest.fixture(scope="session")
def test_tokens(test_config: TestConfig) -> TestTokens:
    """Provide authentication tokens for all tests."""
    return TestTokens(
        admin_token=test_config.admin_token,
        auditor_token=test_config.auditor_token,
        viewer_token=test_config.viewer_token,
        user_token=test_config.user_token
    )

@pytest.fixture(scope="session")
def api_session() -> Generator[requests.Session, None, None]:
    """Provide a reusable requests session for API calls."""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json"
    })
    yield session
    session.close()

@pytest.fixture(scope="function")
def auth_headers_factory(test_tokens: TestTokens):
    """Factory for creating authentication headers for different roles."""
    def _get_headers(role: str = "user") -> Dict[str, str]:
        """Get authentication headers for a specific role."""
        token_map = {
            "admin": test_tokens.admin_token,
            "auditor": test_tokens.auditor_token,
            "viewer": test_tokens.viewer_token,
            "user": test_tokens.user_token
        }

        token = token_map.get(role)
        if not token:
            pytest.skip(f"No {role} token available for testing")

        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    return _get_headers

@pytest.fixture(scope="session", autouse=True)
def check_server_health(test_config: TestConfig, request):
    """Ensure the test server is healthy before running tests."""
    # Skip health check for infrastructure tests
    if hasattr(request.config, 'getoption') and request.config.getoption('--no-server-check', False):
        return

    # Skip health check if running infrastructure tests
    if 'test_infrastructure.py' in str(request.fspath):
        return

    try:
        response = requests.get(
            f"{test_config.base_url}/health",
            timeout=test_config.timeout
        )
        response.raise_for_status()
        print(f"✓ Server health check passed: {test_config.base_url}")
    except requests.RequestException as e:
        pytest.fail(f"Server health check failed: {e}")

def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--no-server-check",
        action="store_true",
        default=False,
        help="Skip server health check for infrastructure tests"
    )

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "rbac: mark test as role-based access control test"
    )
    config.addinivalue_line(
        "markers", "notification: mark test as notification service test"
    )

def pytest_collection_modifyitems(config, items):
    """Automatically mark tests based on their location and name."""
    for item in items:
        # Mark integration tests
        if "integration" in item.nodeid or "test_integration" in item.name:
            item.add_marker(pytest.mark.integration)

        # Mark RBAC tests
        if "rbac" in item.name.lower() or "role" in item.name.lower():
            item.add_marker(pytest.mark.rbac)

        # Mark notification tests
        if "notification" in item.nodeid:
            item.add_marker(pytest.mark.notification)

def pytest_html_report_title(report):
    """Customize HTML report title."""
    report.title = "Advancia Pay Ledger API Test Report"

def pytest_html_results_summary(prefix, summary, postfix):
    """Add custom summary information to HTML report."""
    prefix.extend([
        "<h2>Test Environment</h2>",
        f"<p>Base URL: {os.getenv('BASE_URL', 'http://localhost:4000')}</p>",
        f"<p>Python Version: {sys.version}</p>",
        f"<p>Test Run: {os.getenv('GITHUB_RUN_ID', 'Local Run')}</p>"
    ])
