import React, { lazy, memo, Suspense } from 'react';
import LoadingSpinner from '../LoadingSpinner';

// Lazy-loaded dashboard components
const ComplianceMonitoringDashboard = lazy(() => import('./ComplianceMonitoringDashboard'));
const FinanceFlowWidget = lazy(() => import('./FinanceFlowWidget'));
const GitOpsIntegration = lazy(() => import('./GitOpsIntegration'));
const LoadTestDashboard = lazy(() => import('./LoadTestDashboard'));
const TeamsDashboard = lazy(() => import('./TeamsDashboard'));

// Lazy-loaded admin components
const AdminBalanceManager = lazy(() => import('../AdminBalanceManager'));
const CryptoAdminPanel = lazy(() => import('../CryptoAdminPanel'));
const HealthDashboard = lazy(() => import('../HealthDashboard'));

// Lazy-loaded user components
const RewardsDashboard = lazy(() => import('../RewardsDashboard'));
const TokenWallet = lazy(() => import('../TokenWallet'));
const TransactionTable = lazy(() => import('../TransactionTable'));

// Performance optimized wrapper component with error boundary
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyComponentWrapper = memo<LazyComponentWrapperProps>(
  ({ children, fallback = <LoadingSpinner /> }) => (
    <Suspense fallback={fallback}>{children}</Suspense>
  )
);

LazyComponentWrapper.displayName = 'LazyComponentWrapper';

// Pre-built lazy components for common dashboard sections
export const LazyComplianceDashboard = memo(() => (
  <LazyComponentWrapper>
    <ComplianceMonitoringDashboard />
  </LazyComponentWrapper>
));

export const LazyFinanceWidget = memo(() => (
  <LazyComponentWrapper>
    <FinanceFlowWidget />
  </LazyComponentWrapper>
));

export const LazyGitOpsPanel = memo(() => (
  <LazyComponentWrapper>
    <GitOpsIntegration />
  </LazyComponentWrapper>
));

export const LazyLoadTestPanel = memo(() => (
  <LazyComponentWrapper>
    <LoadTestDashboard />
  </LazyComponentWrapper>
));

export const LazyTeamsPanel = memo(() => (
  <LazyComponentWrapper>
    <TeamsDashboard />
  </LazyComponentWrapper>
));

export const LazyAdminBalance = memo(() => (
  <LazyComponentWrapper>
    <AdminBalanceManager />
  </LazyComponentWrapper>
));

export const LazyCryptoAdmin = memo(() => (
  <LazyComponentWrapper>
    <CryptoAdminPanel />
  </LazyComponentWrapper>
));

export const LazyHealthPanel = memo(() => (
  <LazyComponentWrapper>
    <HealthDashboard />
  </LazyComponentWrapper>
));

export const LazyRewardsPanel = memo(() => (
  <LazyComponentWrapper>
    <RewardsDashboard />
  </LazyComponentWrapper>
));

export const LazyWallet = memo(() => (
  <LazyComponentWrapper>
    <TokenWallet />
  </LazyComponentWrapper>
));

export const LazyTransactions = memo(() => (
  <LazyComponentWrapper>
    <TransactionTable />
  </LazyComponentWrapper>
));

// Set display names for debugging
LazyComplianceDashboard.displayName = 'LazyComplianceDashboard';
LazyFinanceWidget.displayName = 'LazyFinanceWidget';
LazyGitOpsPanel.displayName = 'LazyGitOpsPanel';
LazyLoadTestPanel.displayName = 'LazyLoadTestPanel';
LazyTeamsPanel.displayName = 'LazyTeamsPanel';
LazyAdminBalance.displayName = 'LazyAdminBalance';
LazyCryptoAdmin.displayName = 'LazyCryptoAdmin';
LazyHealthPanel.displayName = 'LazyHealthPanel';
LazyRewardsPanel.displayName = 'LazyRewardsPanel';
LazyWallet.displayName = 'LazyWallet';
LazyTransactions.displayName = 'LazyTransactions';

export default LazyComponentWrapper;
