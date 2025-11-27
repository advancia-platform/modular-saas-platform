"""
Comprehensive pytest test suite for Advancia Platform Notification Services API
Tests notification preferences, Resend email integration, and RBAC enforcement
"""

import os
import pytest
import requests
import time
import json
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class TestConfig:
    """Test configuration settings"""
    base_url: str = os.getenv("BASE_URL", "http://localhost:4000")
    test_user_email: str = "test@example.com"
    test_user_password: str = "testPassword123"
    admin_email: str = "admin@example.com"
    admin_password: str = "adminPassword123"
    auditor_email: str = "auditor@example.com"
    auditor_password: str = "auditorPassword123"
    viewer_email: str = "viewer@example.com"
    viewer_password: str = "viewerPassword123"
    timeout: int = int(os.getenv("TEST_TIMEOUT", "30"))
@dataclass
class TestTokens:
    """Test authentication tokens for different roles"""
    user_token: Optional[str] = None
    admin_token: Optional[str] = None
    auditor_token: Optional[str] = None
    viewer_token: Optional[str] = None
    user_id: Optional[str] = None


@pytest.mark.notification
@pytest.mark.integration
class TestNotificationServicesAPI:
    """Test suite for notification services API endpoints"""

    config = TestConfig()
    tokens = TestTokens()

    @classmethod
    def setup_class(cls):
        """Setup test class with authentication tokens"""
        cls.authenticate_test_users()

    @classmethod
    def authenticate_test_users(cls):
        """Authenticate test users and store tokens"""
        # Authenticate regular user
        user_response = requests.post(
            f"{cls.config.base_url}/api/auth/login",
            json={
                "email": cls.config.test_user_email,
                "password": cls.config.test_user_password
            },
            timeout=cls.config.timeout
        )

        if user_response.status_code == 200:
            user_data = user_response.json()
            cls.tokens.user_token = user_data.get("token")
            if user_data.get("user") and user_data["user"].get("id"):
                cls.tokens.user_id = user_data["user"]["id"]

        # Authenticate admin user
        admin_response = requests.post(
            f"{cls.config.base_url}/api/auth/admin/login",
            json={
                "email": cls.config.admin_email,
                "password": cls.config.admin_password
            },
            timeout=cls.config.timeout
        )

        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            cls.tokens.admin_token = admin_data.get("token")

        # Authenticate auditor user
        auditor_response = requests.post(
            f"{cls.config.base_url}/api/auth/login",
            json={
                "email": cls.config.auditor_email,
                "password": cls.config.auditor_password
            },
            timeout=cls.config.timeout
        )

        if auditor_response.status_code == 200:
            auditor_data = auditor_response.json()
            cls.tokens.auditor_token = auditor_data.get("token")

        # Authenticate viewer user
        viewer_response = requests.post(
            f"{cls.config.base_url}/api/auth/login",
            json={
                "email": cls.config.viewer_email,
                "password": cls.config.viewer_password
            },
            timeout=cls.config.timeout
        )

        if viewer_response.status_code == 200:
            viewer_data = viewer_response.json()
            cls.tokens.viewer_token = viewer_data.get("token")    def get_auth_headers(self, role: str = "user") -> Dict[str, str]:
        """Get authorization headers for requests"""
        token_map = {
            "user": self.tokens.user_token,
            "admin": self.tokens.admin_token,
            "auditor": self.tokens.auditor_token,
            "viewer": self.tokens.viewer_token
        }

        token = token_map.get(role)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        } if token else {"Content-Type": "application/json"}


@pytest.mark.notification
class TestNotificationPreferences(TestNotificationServicesAPI):
    """Test notification preferences endpoints"""

    def test_get_preferences_authenticated(self):
        """Test retrieving user preferences with valid authentication"""
        response = requests.get(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "email" in data["data"]
        assert "sms" in data["data"]
        assert "slack" in data["data"]
        assert "telegram" in data["data"]

        # Verify structure of email preferences
        email_prefs = data["data"]["email"]
        assert isinstance(email_prefs["enabled"], bool)
        assert isinstance(email_prefs["alerts"], bool)

    def test_get_preferences_unauthorized(self):
        """Test preferences access without authentication"""
        response = requests.get(
            f"{self.config.base_url}/api/preferences",
            timeout=self.config.timeout
        )

        assert response.status_code == 401

    def test_update_preferences_full(self):
        """Test updating all notification preferences"""
        preferences_data = {
            "email": {
                "enabled": True,
                "alerts": True,
                "reports": False,
                "summary": True,
                "marketing": False
            },
            "sms": {
                "enabled": False,
                "critical": True,
                "incidents": False,
                "maintenance": False
            },
            "slack": {
                "enabled": True,
                "updates": True,
                "deployments": False,
                "compliance": False,
                "webhooks": True
            },
            "telegram": {
                "enabled": False,
                "notifications": False,
                "alerts": False,
                "broadcasts": False
            },
            "digest": {
                "frequency": "DAILY",
                "time": "08:00",
                "timezone": "UTC"
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            json=preferences_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Update failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "email" in data["data"]

        # Verify the updates were applied
        assert data["data"]["email"]["enabled"] is True
        assert data["data"]["email"]["marketing"] is False
        assert data["data"]["sms"]["enabled"] is False

    def test_update_preferences_partial(self):
        """Test partial preference updates"""
        partial_data = {
            "email": {
                "marketing": True
            },
            "digest": {
                "frequency": "WEEKLY"
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            json=partial_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True

    def test_update_preferences_invalid_data(self):
        """Test preferences update with invalid data"""
        invalid_data = {
            "email": {
                "enabled": "not_a_boolean",  # Invalid type
                "alerts": "invalid"
            },
            "digest": {
                "frequency": "INVALID_FREQUENCY"  # Invalid enum value
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            json=invalid_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 400

        data = response.json()
        assert data["success"] is False
        assert "error" in data

    def test_get_available_channels(self):
        """Test retrieving available notification channels"""
        response = requests.get(
            f"{self.config.base_url}/api/preferences/channels",
            headers=self.get_auth_headers(),
            timeout=self.config.timeout
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

        expected_channels = ["email", "sms", "slack", "telegram"]
        for channel in expected_channels:
            assert channel in data["data"]


@pytest.mark.notification
class TestResendEmailService(TestNotificationServicesAPI):
    """Test Resend email service integration"""

    def test_connection_health_check(self):
        """Test Resend service health check"""
        response = requests.get(
            f"{self.config.base_url}/api/resend/test-connection",
            headers=self.get_auth_headers(),
            timeout=self.config.timeout
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["provider"] == "resend"
        assert "status" in data

    def test_send_simple_email(self):
        """Test sending a simple email"""
        email_data = {
            "to": "test@example.com",
            "subject": "API Test Email",
            "html": "<h1>Test Email</h1><p>This is a test email from pytest.</p>",
            "text": "Test Email\\n\\nThis is a test email from pytest."
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/send",
            headers=self.get_auth_headers(),
            json=email_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Email send failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "messageId" in data

    def test_send_template_email(self):
        """Test sending template-based email"""
        template_data = {
            "to": "test@example.com",
            "template": "welcome",
            "variables": {
                "userName": "Test User",
                "companyName": "Advancia Platform",
                "loginUrl": "https://app.advancia.io/login"
            }
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/template",
            headers=self.get_auth_headers(),
            json=template_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert "messageId" in data

    def test_send_campaign_email_admin(self):
        """Test sending campaign email with admin permissions"""
        if not self.tokens.admin_token:
            pytest.skip("Admin token not available")

        campaign_data = {
            "recipients": ["test1@example.com", "test2@example.com"],
            "subject": "Platform Update Notification",
            "template": "compliance-report",
            "variables": {
                "reportDate": "2025-11-26",
                "totalTransactions": "1,247",
                "complianceScore": "98.5%"
            }
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/campaign",
            headers=self.get_auth_headers(use_admin=True),
            json=campaign_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Campaign failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "campaignId" in data["data"]

    def test_send_campaign_email_user_forbidden(self):
        """Test that regular users cannot send campaign emails"""
        campaign_data = {
            "recipients": ["test@example.com"],
            "subject": "Unauthorized Campaign",
            "text": "This should fail"
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/campaign",
            headers=self.get_auth_headers(use_admin=False),
            json=campaign_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 403

    def test_get_email_templates(self):
        """Test retrieving available email templates"""
        response = requests.get(
            f"{self.config.base_url}/api/resend/templates",
            headers=self.get_auth_headers(),
            timeout=self.config.timeout
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

        expected_templates = ["welcome", "password-reset", "transaction-alert", "compliance-report"]
        for template in expected_templates:
            assert template in data["data"]

    def test_send_email_invalid_email(self):
        """Test sending email with invalid email address"""
        invalid_email_data = {
            "to": "invalid-email",  # Invalid email format
            "subject": "Test",
            "text": "Test content"
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/send",
            headers=self.get_auth_headers(),
            json=invalid_email_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 400

        data = response.json()
        assert data["success"] is False
        assert "error" in data

    def test_send_email_missing_content(self):
        """Test sending email without content"""
        incomplete_data = {
            "to": "test@example.com",
            "subject": "Test"
            # Missing html and text content
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/send",
            headers=self.get_auth_headers(),
            json=incomplete_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 400


@pytest.mark.rbac
@pytest.mark.notification
class TestRBACPermissions(TestNotificationServicesAPI):
    """Test role-based access control for notification services"""

    def test_admin_can_save_preferences(self):
        """Test that admin users can save notification preferences"""
        if not self.tokens.admin_token:
            pytest.skip("Admin token not available")

        payload = {
            "email": {
                "enabled": True,
                "alerts": True,
                "reports": True,
                "marketing": False
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("admin"),
            json=payload,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Admin preference save failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"]["enabled"] is True
        assert data["data"]["email"]["alerts"] is True

    def test_auditor_can_save_preferences(self):
        """Test that auditor users can save notification preferences"""
        if not self.tokens.auditor_token:
            pytest.skip("Auditor token not available")

        payload = {
            "sms": {
                "enabled": True,
                "critical": True,
                "incidents": False
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("auditor"),
            json=payload,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Auditor preference save failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert data["data"]["sms"]["enabled"] is True
        assert data["data"]["sms"]["critical"] is True

    def test_viewer_cannot_save_preferences(self):
        """Test that viewer users cannot save notification preferences (read-only)"""
        if not self.tokens.viewer_token:
            pytest.skip("Viewer token not available")

        payload = {
            "slack": {
                "enabled": True,
                "updates": True,
                "deployments": False
            }
        }

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("viewer"),
            json=payload,
            timeout=self.config.timeout
        )

        # Viewers should be forbidden from saving preferences (403)
        # or method not allowed if endpoint doesn't support viewer role
        assert response.status_code in [403, 405], f"Expected 403/405, got {response.status_code}: {response.text}"

        data = response.json()
        assert "error" in data or "message" in data

    def test_viewer_can_read_preferences(self):
        """Test that viewer users can read notification preferences"""
        if not self.tokens.viewer_token:
            pytest.skip("Viewer token not available")

        response = requests.get(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("viewer"),
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Viewer preference read failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "email" in data["data"]
        assert "sms" in data["data"]
        assert "slack" in data["data"]
        assert "telegram" in data["data"]

    def test_admin_can_send_campaigns(self):
        """Test that admin users can send email campaigns"""
        if not self.tokens.admin_token:
            pytest.skip("Admin token not available")

        campaign_data = {
            "recipients": ["test1@example.com", "test2@example.com"],
            "subject": "RBAC Test Campaign - Admin Access",
            "template": "compliance-report",
            "variables": {
                "reportDate": "2025-11-26",
                "complianceScore": "99.2%"
            }
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/campaign",
            headers=self.get_auth_headers("admin"),
            json=campaign_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 200, f"Admin campaign failed: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert "campaignId" in data["data"]

    def test_auditor_cannot_send_campaigns(self):
        """Test that auditor users cannot send email campaigns"""
        if not self.tokens.auditor_token:
            pytest.skip("Auditor token not available")

        campaign_data = {
            "recipients": ["test@example.com"],
            "subject": "Unauthorized Campaign Attempt",
            "text": "This should be forbidden"
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/campaign",
            headers=self.get_auth_headers("auditor"),
            json=campaign_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    def test_viewer_cannot_send_campaigns(self):
        """Test that viewer users cannot send email campaigns"""
        if not self.tokens.viewer_token:
            pytest.skip("Viewer token not available")

        campaign_data = {
            "recipients": ["test@example.com"],
            "subject": "Unauthorized Campaign Attempt",
            "text": "This should be forbidden"
        }

        response = requests.post(
            f"{self.config.base_url}/api/resend/campaign",
            headers=self.get_auth_headers("viewer"),
            json=campaign_data,
            timeout=self.config.timeout
        )

        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"

    def test_all_roles_can_read_templates(self):
        """Test that all authenticated roles can read email templates"""
        roles_to_test = ["user", "admin", "auditor", "viewer"]

        for role in roles_to_test:
            token = getattr(self.tokens, f"{role}_token")
            if not token:
                continue

            response = requests.get(
                f"{self.config.base_url}/api/resend/templates",
                headers=self.get_auth_headers(role),
                timeout=self.config.timeout
            )

            assert response.status_code == 200, f"{role.capitalize()} template read failed: {response.text}"

            data = response.json()
            assert data["success"] is True
            assert isinstance(data["data"], list)

    def test_role_based_email_sending(self):
        """Test role-based permissions for sending individual emails"""
        # Test data for email sending
        email_data = {
            "to": "test@example.com",
            "subject": f"RBAC Test Email",
            "html": "<h1>Role-Based Test</h1><p>Testing email permissions</p>",
            "text": "Role-Based Test\\n\\nTesting email permissions"
        }

        # Roles that should be able to send emails
        allowed_roles = ["user", "admin", "auditor"]

        for role in allowed_roles:
            token = getattr(self.tokens, f"{role}_token")
            if not token:
                continue

            email_data["subject"] = f"RBAC Test Email - {role.capitalize()} Role"

            response = requests.post(
                f"{self.config.base_url}/api/resend/send",
                headers=self.get_auth_headers(role),
                json=email_data,
                timeout=self.config.timeout
            )

            assert response.status_code == 200, f"{role.capitalize()} email send failed: {response.text}"

            data = response.json()
            assert data["success"] is True

    def test_cross_role_preference_isolation(self):
        """Test that preference updates from different roles are properly isolated"""
        # Skip if we don't have multiple role tokens
        if not (self.tokens.admin_token and self.tokens.auditor_token):
            pytest.skip("Multiple role tokens not available")

        # Admin sets preferences
        admin_prefs = {
            "email": {"enabled": True, "alerts": True, "marketing": False},
            "digest": {"frequency": "DAILY"}
        }

        admin_response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("admin"),
            json=admin_prefs,
            timeout=self.config.timeout
        )

        assert admin_response.status_code == 200

        # Auditor sets different preferences (should be separate user preferences)
        auditor_prefs = {
            "email": {"enabled": False, "alerts": False, "marketing": True},
            "digest": {"frequency": "WEEKLY"}
        }

        auditor_response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("auditor"),
            json=auditor_prefs,
            timeout=self.config.timeout
        )

        assert auditor_response.status_code == 200

        # Verify admin preferences unchanged
        admin_read = requests.get(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers("admin"),
            timeout=self.config.timeout
        )

        assert admin_read.status_code == 200
        admin_data = admin_read.json()

        # Admin's preferences should remain as set
        assert admin_data["data"]["email"]["enabled"] is True
        assert admin_data["data"]["email"]["marketing"] is False


@pytest.mark.slow
@pytest.mark.notification
class TestPerformanceAndLoad(TestNotificationServicesAPI):
    """Performance and load testing scenarios"""

    def test_preferences_update_performance(self):
        """Test performance of bulk preferences update"""
        large_preferences_data = {
            "email": {
                "enabled": True,
                "alerts": True,
                "reports": True,
                "summary": True,
                "marketing": False,
                "promotions": False,
                "newsletters": True
            },
            "sms": {
                "enabled": True,
                "critical": True,
                "incidents": True,
                "maintenance": False,
                "alerts": True
            },
            "slack": {
                "enabled": True,
                "updates": True,
                "deployments": True,
                "compliance": True,
                "webhooks": True,
                "monitoring": True
            },
            "telegram": {
                "enabled": True,
                "notifications": True,
                "alerts": True,
                "broadcasts": False,
                "updates": True
            },
            "digest": {
                "frequency": "DAILY",
                "time": "08:00",
                "timezone": "UTC",
                "includeMetrics": True,
                "includeSummary": True
            }
        }

        start_time = time.time()

        response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            json=large_preferences_data,
            timeout=self.config.timeout
        )

        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds

        assert response.status_code == 200
        assert response_time < 2000, f"Response time {response_time}ms exceeds 2000ms threshold"

        data = response.json()
        assert data["success"] is True

    def test_concurrent_preferences_access(self):
        """Test concurrent access to preferences API (basic concurrency test)"""
        import threading
        import queue

        results = queue.Queue()

        def make_request():
            try:
                response = requests.get(
                    f"{self.config.base_url}/api/preferences",
                    headers=self.get_auth_headers(),
                    timeout=self.config.timeout
                )
                results.put(response.status_code)
            except Exception as e:
                results.put(str(e))

        # Create 5 concurrent threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Check all requests succeeded
        for _ in range(5):
            result = results.get()
            assert result == 200, f"Concurrent request failed with: {result}"


@pytest.mark.integration
@pytest.mark.notification
class TestIntegrationScenarios(TestNotificationServicesAPI):
    """End-to-end integration testing scenarios"""

    def test_complete_notification_workflow(self):
        """Test complete notification preference to email send workflow"""
        # Step 1: Update preferences to enable email notifications
        preferences_data = {
            "email": {
                "enabled": True,
                "alerts": True,
                "reports": True
            }
        }

        pref_response = requests.put(
            f"{self.config.base_url}/api/preferences",
            headers=self.get_auth_headers(),
            json=preferences_data,
            timeout=self.config.timeout
        )

        assert pref_response.status_code == 200

        # Step 2: Send a notification email
        email_data = {
            "to": "test@example.com",
            "subject": "Integration Test Notification",
            "template": "transaction-alert",
            "variables": {
                "transactionId": "TXN-12345",
                "amount": "$100.00",
                "timestamp": "2025-11-26 15:30:00"
            }
        }

        email_response = requests.post(
            f"{self.config.base_url}/api/resend/template",
            headers=self.get_auth_headers(),
            json=email_data,
            timeout=self.config.timeout
        )

        assert email_response.status_code == 200

        # Step 3: Verify notification was logged (if endpoint exists)
        # This would test the notification logging integration

        email_data = email_response.json()
        assert email_data["success"] is True
        assert "messageId" in email_data


# Pytest configuration and fixtures
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment before running tests"""
    print("\\n🧪 Setting up test environment for Notification Services API...")

    config = TestConfig()

    # Verify server is running
    try:
        response = requests.get(f"{config.base_url}/health", timeout=5)
        if response.status_code != 200:
            pytest.exit(f"Server not healthy at {config.base_url}")
    except requests.RequestException:
        pytest.exit(f"Cannot connect to server at {config.base_url}")

    print(f"✅ Server is running at {config.base_url}")

    yield

    print("\\n🧹 Cleaning up test environment...")


if __name__ == "__main__":
    # Run tests when script is executed directly
    pytest.main([__file__, "-v", "--tb=short"])
