/**
 * Barrel exports for components
 */

// Layout Components
export { Header } from './Header';
export { AdminLayout, AuthLayout, DashboardLayout, default as Layout } from './Layout';
export { default as SidebarLayout } from './SidebarLayout';

// Auth & Role Components
export { default as AuthProvider } from './AuthProvider';
export { default as RequireRole } from './RequireRole';
export { StripeProvider, useStripe, withStripe } from './StripeProvider';

// Admin Components
export { default as AdminTransactionTable } from './admin/AdminTransactionTable';
export { default as SilentModeSwitch } from './admin/SilentModeSwitch';
export { default as AdminNav } from './AdminNav';
export { default as CryptoAdminPanel } from './CryptoAdminPanel';

// UI Primitives
export { Alert, AlertDescription, AlertTitle } from './ui/alert';
export { Badge, badgeVariants } from './ui/badge';
export { Button, buttonVariants } from './ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Checkbox } from './ui/checkbox';
export { DataTable } from './ui/data-table';
export {
  Form,
  FormActions,
  FormCheckbox,
  FormField,
  FormRow,
  FormSection,
  FormSelect,
  useForm,
  useFormContext,
} from './ui/form';
export { Input } from './ui/input';
export { Select } from './ui/select';

// Dashboard Components
export { CashFlowChart } from './dashboard/CashFlowChart';
export { MetricsCard } from './dashboard/MetricsCard';
export { RegulatoryStatusPanel } from './dashboard/RegulatoryStatusPanel';
export { RevenueChart } from './dashboard/RevenueChart';

// Metric Card (Enhanced version with animations)
export { MetricCard, MetricCardGrid } from './MetricCard';

// Table Component
export { Table } from './Table';
export type { TableColumn, TableProps } from './Table';

// Utility Components
export { DateRangePicker } from './DateRangePicker';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as LoadingSpinner } from './LoadingSpinner';
export { MoneyBackBadge, MoneyBackCard, MoneyBackFooter } from './MoneyBackBadge';
export { default as QuickActions } from './QuickActions';
export { default as ScrollToTop } from './ScrollToTop';
