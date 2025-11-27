"""
Simple test validation script to check pytest configuration and test infrastructure.
This can be run without the backend server to validate our testing setup.
"""

import pytest
import os
import sys
import json
from pathlib import Path

# Test our pytest markers
@pytest.mark.unit
def test_pytest_configuration():
    """Test that pytest is properly configured with our custom settings."""
    # Check that pytest.ini exists
    pytest_ini = Path("pytest.ini")
    assert pytest_ini.exists(), "pytest.ini configuration file should exist"

    # Check that our test configuration is loaded
    config_content = pytest_ini.read_text()
    assert "tool:pytest" in config_content, "pytest.ini should contain [tool:pytest] section"
    assert "--cov=src" in config_content, "Coverage configuration should be set"
    assert "rbac:" in config_content, "RBAC marker should be defined"
    assert "notification:" in config_content, "Notification marker should be defined"

@pytest.mark.unit
def test_requirements_file():
    """Test that test requirements file exists and contains necessary dependencies."""
    requirements_file = Path("requirements-test.txt")
    assert requirements_file.exists(), "requirements-test.txt should exist"

    requirements_content = requirements_file.read_text()
    assert "pytest>=" in requirements_content, "pytest should be in requirements"
    assert "pytest-cov>=" in requirements_content, "pytest-cov should be in requirements"
    assert "requests>=" in requirements_content, "requests should be in requirements"

@pytest.mark.unit
def test_conftest_configuration():
    """Test that conftest.py exists and contains our fixtures."""
    conftest_file = Path("conftest.py")
    assert conftest_file.exists(), "conftest.py should exist"

    conftest_content = conftest_file.read_text()
    assert "TestConfig" in conftest_content, "TestConfig should be defined"
    assert "test_config" in conftest_content, "test_config fixture should be defined"
    assert "auth_headers_factory" in conftest_content, "auth_headers_factory fixture should be defined"

@pytest.mark.integration
def test_environment_variables():
    """Test environment variable handling for different scenarios."""
    # Test default values
    from conftest import TestConfig

    # Clear environment variables temporarily
    original_base_url = os.getenv("BASE_URL")
    original_timeout = os.getenv("TEST_TIMEOUT")

    if "BASE_URL" in os.environ:
        del os.environ["BASE_URL"]
    if "TEST_TIMEOUT" in os.environ:
        del os.environ["TEST_TIMEOUT"]

    # Test defaults
    config = TestConfig()
    assert config.base_url == "http://localhost:4000", "Default base URL should be localhost:4000"
    assert config.timeout == 30, "Default timeout should be 30 seconds"

    # Restore environment variables
    if original_base_url:
        os.environ["BASE_URL"] = original_base_url
    if original_timeout:
        os.environ["TEST_TIMEOUT"] = original_timeout

@pytest.mark.unit
def test_test_runner_script():
    """Test that our test runner script exists and is properly configured."""
    runner_script = Path("run_tests.py")
    assert runner_script.exists(), "run_tests.py should exist"

    runner_content = runner_script.read_text(encoding='utf-8')
    assert "def main():" in runner_content, "main() function should be defined"
    assert "argparse" in runner_content, "Should use argparse for command line arguments"
    assert "--coverage" in runner_content, "Should support coverage options"

@pytest.mark.unit
def test_github_workflow():
    """Test that GitHub Actions workflow is properly configured."""
    workflow_file = Path("../.github/workflows/api-tests-coverage.yml")
    assert workflow_file.exists(), "GitHub Actions workflow should exist"

    workflow_content = workflow_file.read_text()
    assert "pytest" in workflow_content, "Workflow should use pytest"
    assert "coverage.xml" in workflow_content, "Workflow should generate coverage reports"
    assert "codecov" in workflow_content, "Workflow should upload to Codecov"

@pytest.mark.slow
@pytest.mark.integration
def test_test_file_structure():
    """Test that our main test file has proper structure and markers."""
    test_file = Path("tests/api/test_notification_services.py")
    assert test_file.exists(), "Main test file should exist"

    test_content = test_file.read_text()

    # Check for pytest markers
    assert "@pytest.mark.rbac" in test_content, "RBAC tests should be marked"
    assert "@pytest.mark.notification" in test_content, "Notification tests should be marked"
    assert "@pytest.mark.slow" in test_content, "Slow tests should be marked"
    assert "@pytest.mark.integration" in test_content, "Integration tests should be marked"

    # Check for test classes
    assert "class TestRBACPermissions" in test_content, "RBAC test class should exist"
    assert "class TestNotificationPreferences" in test_content, "Preferences test class should exist"
    assert "class TestResendEmailService" in test_content, "Email service test class should exist"

def test_coverage_configuration():
    """Test that coverage is properly configured."""
    # Check pytest.ini for coverage settings
    pytest_ini = Path("pytest.ini")
    config_content = pytest_ini.read_text()

    assert "--cov-fail-under=80" in config_content, "Coverage threshold should be set"
    assert "--cov-report=xml" in config_content, "XML coverage report should be enabled"
    assert "--cov-report=html" in config_content, "HTML coverage report should be enabled"

def test_security_tools_configuration():
    """Test that security analysis tools are configured."""
    requirements_content = Path("requirements-test.txt").read_text()

    assert "bandit>=" in requirements_content, "Bandit security scanner should be included"
    assert "safety>=" in requirements_content, "Safety dependency scanner should be included"

    # Check that runner script supports security checks
    runner_content = Path("run_tests.py").read_text(encoding='utf-8')
    assert "--security" in runner_content, "Runner should support security checks"
    assert "bandit" in runner_content, "Runner should include bandit"
    assert "safety" in runner_content, "Runner should include safety"

if __name__ == "__main__":
    """Run tests directly for quick validation."""
    print("🧪 Running pytest infrastructure validation tests...")
    print("=" * 60)

    # Run tests with verbose output and coverage
    exit_code = pytest.main([
        "-v",
        "--tb=short",
        "--no-cov",  # Skip coverage for this validation
        __file__
    ])

    if exit_code == 0:
        print("\n✅ All pytest infrastructure tests passed!")
        print("🚀 Your testing environment is ready!")
    else:
        print("\n❌ Some infrastructure tests failed!")
        print("🔧 Please check your testing setup.")

    sys.exit(exit_code)
