import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, describe, beforeEach } from 'vitest';
import NotificationPreferencesModal from '../NotificationPreferences';

// Mock the hooks and components
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    preferences: {
      id: '1',
      userId: 'user1',
      emailEnabled: true,
      inAppEnabled: true,
      pushEnabled: false,
      transactionAlerts: true,
      securityAlerts: true,
      systemAlerts: true,
      rewardAlerts: true,
      adminAlerts: false,
      withdrawals: true,
      complianceAlerts: true,
      auditLogs: false,
      digestFrequency: 'NONE' as const,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    updatePreferences: vi.fn(),
    loading: false,
  })),
}));

vi.mock('../RoleGuard', () => ({
  default: ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
    // Mock role guard to always show content for testing
    return <div data-testid=\"role-guard\" data-roles={roles.join(',')}>{children}</div>;
  },
}));

vi.mock('../LoadingSpinner', () => ({
  default: ({ size }: { size?: string }) => (
    <div data-testid=\"loading-spinner\" data-size={size}>Loading...</div>
  ),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NotificationPreferences', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'user1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal when open', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Customize how and when you receive notifications')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<NotificationPreferencesModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Notification Preferences')).not.toBeInTheDocument();
  });

  test('displays delivery methods section', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('Delivery Methods')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('In-App Notifications')).toBeInTheDocument();
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
  });

  test('displays notification categories section', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('Notification Categories')).toBeInTheDocument();
    expect(screen.getByText('Security Alerts')).toBeInTheDocument();
    expect(screen.getByText('Transaction Alerts')).toBeInTheDocument();
    expect(screen.getByText('Rewards & Bonuses')).toBeInTheDocument();
    expect(screen.getByText('System Notifications')).toBeInTheDocument();
  });

  test('displays role-restricted categories with labels', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('Compliance Alerts')).toBeInTheDocument();
    expect(screen.getByText('ADMIN, AUDITOR only')).toBeInTheDocument();
    
    expect(screen.getByText('Audit Log Notifications')).toBeInTheDocument();
    expect(screen.getByText('ADMIN only')).toBeInTheDocument();
  });

  test('displays digest frequency options', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('Email Digest Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Never')).toBeInTheDocument();
    expect(screen.getByLabelText('daily')).toBeInTheDocument();
    expect(screen.getByLabelText('weekly')).toBeInTheDocument();
  });

  test('toggles preferences when clicked', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    const emailToggle = screen.getByRole('checkbox', { name: /email/i });
    
    // Initial state should be checked (based on mock data)
    expect(emailToggle).toBeChecked();
    
    // Click to toggle
    fireEvent.click(emailToggle);
    
    // Should now be unchecked
    expect(emailToggle).not.toBeChecked();
  });

  test('shows unsaved changes warning', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    // Make a change
    const emailToggle = screen.getByRole('checkbox', { name: /email/i });
    fireEvent.click(emailToggle);
    
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  test('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<NotificationPreferencesModal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onClose when close button (X) is clicked', () => {
    const onClose = vi.fn();
    render(<NotificationPreferencesModal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('Close'));
    
    expect(onClose).toHaveBeenCalled();
  });

  test('shows role guard for save button', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    const roleGuards = screen.getAllByTestId('role-guard');
    const saveButtonRoleGuard = roleGuards.find(guard => 
      guard.getAttribute('data-roles') === 'ADMIN,AUDITOR'
    );
    
    expect(saveButtonRoleGuard).toBeInTheDocument();
    expect(saveButtonRoleGuard).toContainElement(screen.getByText('Save Preferences'));
  });

  test('shows view-only message for restricted users', () => {
    // Mock RoleGuard to show fallback
    vi.mocked(require('../RoleGuard').default).mockImplementation(
      ({ fallback, roles }: { fallback?: React.ReactNode; roles: string[] }) => {
        if (roles.includes('ADMIN') || roles.includes('AUDITOR')) {
          return fallback;
        }
        return null;
      }
    );

    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByText('View-only access')).toBeInTheDocument();
  });

  test('handles digest frequency changes', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    const weeklyRadio = screen.getByLabelText('weekly');
    fireEvent.click(weeklyRadio);
    
    expect(weeklyRadio).toBeChecked();
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  test('disables save button when no changes', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Preferences');
    expect(saveButton).toBeDisabled();
  });

  test('enables save button when changes are made', () => {
    render(<NotificationPreferencesModal {...defaultProps} />);
    
    // Make a change
    const emailToggle = screen.getByRole('checkbox', { name: /email/i });
    fireEvent.click(emailToggle);
    
    const saveButton = screen.getByText('Save Preferences');
    expect(saveButton).not.toBeDisabled();
  });

  test('shows loading state', () => {
    const mockUseNotifications = vi.fn(() => ({
      preferences: null,
      updatePreferences: vi.fn(),
      loading: true,
    }));
    
    vi.mocked(require('@/hooks/useNotifications').useNotifications).mockImplementation(
      mockUseNotifications
    );

    render(<NotificationPreferencesModal {...defaultProps} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  test('handles save operation', async () => {
    const updatePreferences = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    
    vi.mocked(require('@/hooks/useNotifications').useNotifications).mockImplementation(() => ({
      preferences: {
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
      },
      updatePreferences,
      loading: false,
    }));

    render(<NotificationPreferencesModal {...defaultProps} onClose={onClose} />);
    
    // Make a change
    const emailToggle = screen.getByRole('checkbox', { name: /email/i });
    fireEvent.click(emailToggle);
    
    // Save
    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalled();
    });
  });

  test('handles save errors gracefully', async () => {
    const updatePreferences = vi.fn().mockRejectedValue(new Error('Save failed'));
    const toast = require('react-toastify').toast;
    
    vi.mocked(require('@/hooks/useNotifications').useNotifications).mockImplementation(() => ({
      preferences: {
        emailEnabled: true,
      },
      updatePreferences,
      loading: false,
    }));

    render(<NotificationPreferencesModal {...defaultProps} />);
    
    // Make a change and save
    const emailToggle = screen.getByRole('checkbox', { name: /email/i });
    fireEvent.click(emailToggle);
    
    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save preferences. Please try again.');
    });
  });
});

