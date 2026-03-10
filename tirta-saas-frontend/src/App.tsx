import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { ToastProvider, ErrorBoundary, PrivateRoute } from './components';

import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';
import RoleBasedDashboard from './pages/RoleBasedDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminLogin from './pages/auth/AdminLogin';
// Customer Portal - NEW
import CustomerLoginNew from './pages/customer/CustomerLogin';
import CustomerDashboardNew from './pages/customer/CustomerDashboard';
import CustomerInvoicesNew from './pages/customer/CustomerInvoices';
import CustomerPaymentsNew from './pages/customer/CustomerPayments';
import CustomerUsageNew from './pages/customer/CustomerUsage';
import CustomerProfileNew from './pages/customer/CustomerProfile';
import CustomerPayInvoiceNew from './pages/customer/CustomerPayInvoice';
// End Customer Portal
import CustomerList from './pages/customers/CustomerList';
import CustomerDetails from './pages/customers/CustomerDetails';
import CustomerForm from './pages/customers/CustomerForm';
import BulkImportCustomers from './pages/customers/BulkImportCustomers';
import UsageList from './pages/usage/UsageList';
import MeterReadingForm from './pages/usage/MeterReadingForm';
import UsageHistory from './pages/usage/UsageHistory';
import BulkImportWaterUsage from './pages/usage/BulkImportWaterUsage';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceForm from './pages/invoices/InvoiceForm';
import InvoiceDetails from './pages/invoices/InvoiceDetails';
import BulkInvoiceGeneration from './pages/invoices/bulk-generation/BulkInvoiceGeneration';
import SubscriptionTypeList from './pages/subscriptions/SubscriptionTypeList';
import SubscriptionTypeForm from './pages/subscriptions/SubscriptionTypeForm';
import WaterRateList from './pages/water-rates/WaterRateList';
import WaterRateForm from './pages/water-rates/WaterRateForm';
import RateHistory from './pages/water-rates/RateHistory';
import { PaymentList, PaymentForm, PaymentReceipt } from './pages/payments';
import PaymentProofManagement from './pages/payment-proofs/PaymentProofManagement';
import PaymentProofSubmitForm from './pages/payment-proofs/PaymentProofSubmitForm';
import { 
  ReportsDashboard, 
  RevenueReport, 
  CustomerAnalytics,
  PaymentReport,
  UsageReport,
  OutstandingReport
} from './pages/reports';
import { CustomerProfile, CustomerProfileEdit, ChangePassword } from './pages/customer-profile';
import { CustomerInvoiceList, CustomerInvoiceDetail } from './pages/customer-invoices';
import { CustomerPaymentForm, PaymentSuccess, CustomerPaymentInfo, CustomerPaymentConfirmation } from './pages/customer-payments';
import { CustomerUsageMonitor } from './pages/customer-usage';
import { TenantManagement, PlatformAnalytics, SubscriptionPlans } from './pages/platform';
import { TenantPaymentVerification } from './pages/tenant-payments';
import { PlatformSubscriptionVerification } from './pages/platform-payments';
import { TenantPaymentSettings, PlatformPaymentSettings } from './pages/settings';
import { LandingPage } from './pages/public';
import TenantRegistration from './pages/auth/TenantRegistration';
import RegisterAccount from './pages/auth/RegisterAccount';
import SetupTenant from './pages/auth/SetupTenant';
import SubscriptionStatusPage from './pages/subscription/SubscriptionStatusPage';
import SubscriptionUpgradePage from './pages/subscription/SubscriptionUpgradePage';
import UserManagementList from './pages/user-management/UserManagementList';
import NotFound from './pages/NotFound';
import TestPage from './pages/TestPage';

function App() {
  console.log('=== App Component Rendering ===');
  
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <ErrorBoundary>
          <ToastProvider>
            <Router>
            <Routes>
            {/* Public Routes - Landing Page First */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Debug route */}
            <Route path="/debug" element={
              <div style={{ padding: '50px', backgroundColor: 'yellow' }}>
                <h1 style={{ fontSize: '30px', marginBottom: '20px' }}>DEBUG PAGE</h1>
                <p>If you see this, routing works!</p>
                <pre>{JSON.stringify({
                  path: window.location.pathname,
                  hash: window.location.hash,
                  search: window.location.search
                }, null, 2)}</pre>
              </div>
            } />

            {/* Public Routes */}
            <Route path="/register" element={<RegisterAccount />} />
            <Route path="/register-legacy" element={<TenantRegistration />} />

            {/* Setup Tenant — requires login but no tenant yet */}
            <Route path="/setup-tenant" element={<SetupTenant />} />
            
            {/* Auth Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Customer Portal Routes */}
            <Route path="/customer/login" element={<CustomerLoginNew />} />
            <Route path="/customer/dashboard" element={<CustomerDashboardNew />} />
            <Route path="/customer/invoices" element={<CustomerInvoicesNew />} />
            <Route path="/customer/pay/:invoiceId" element={<CustomerPayInvoiceNew />} />
            <Route path="/customer/payments" element={<CustomerPaymentsNew />} />
            <Route path="/customer/usage" element={<CustomerUsageNew />} />
            <Route path="/customer/profile" element={<CustomerProfileNew />} />
            
            {/* Test route - outside auth to verify routing works */}
            <Route path="/test-simple" element={
              <div style={{ backgroundColor: 'red', color: 'white', padding: '50px', fontSize: '30px', minHeight: '100vh' }}>
                <h1>SIMPLE TEST - NO AUTH</h1>
                <p>If you see this, React Router works!</p>
              </div>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <PrivateRoute requiredRole="admin">
                <DashboardLayout />
              </PrivateRoute>
            }>
              <Route index element={
                <ErrorBoundary>
                  <RoleBasedDashboard />
                </ErrorBoundary>
              } />
              <Route path="test" element={<TestPage />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/bulk-import" element={<BulkImportCustomers />} />
              <Route path="customers/new" element={<CustomerForm mode="create" />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="customers/:id/edit" element={<CustomerForm mode="edit" />} />
              <Route path="subscriptions" element={<SubscriptionTypeList />} />
              <Route path="subscriptions/create" element={<SubscriptionTypeForm />} />
              <Route path="subscriptions/edit/:id" element={<SubscriptionTypeForm />} />
              <Route path="water-rates" element={<WaterRateList />} />
              <Route path="water-rates/create" element={<WaterRateForm />} />
              <Route path="water-rates/edit/:id" element={<WaterRateForm />} />
              <Route path="water-rates/history" element={<RateHistory />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/bulk-generate" element={<BulkInvoiceGeneration />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetails />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="payments" element={<PaymentList />} />
              <Route path="payments/new" element={<PaymentForm />} />
              <Route path="payments/:id/edit" element={<PaymentForm />} />
              <Route path="payments/:id/receipt" element={<PaymentReceipt />} />
              
              {/* Payment Proof Routes */}
              <Route path="payment-proofs" element={<PaymentProofManagement />} />
              <Route path="payment-proofs/submit" element={<PaymentProofSubmitForm />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="reports/revenue" element={<RevenueReport />} />
              <Route path="reports/customers" element={<CustomerAnalytics />} />
              <Route path="reports/payments" element={<PaymentReport />} />
              <Route path="reports/usage" element={<UsageReport />} />
              <Route path="reports/outstanding" element={<OutstandingReport />} />
              <Route path="settings" element={<TenantPaymentSettings />} />
              <Route path="usage" element={<UsageList />} />
              <Route path="usage/create" element={<MeterReadingForm />} />
              <Route path="usage/bulk-import" element={<BulkImportWaterUsage />} />
              <Route path="usage/edit/:id" element={<MeterReadingForm />} />
              <Route path="usage/:customerId/history" element={<UsageHistory />} />
              
              {/* User Management */}
              <Route path="users" element={<UserManagementList />} />
              
              {/* Platform Owner Routes */}
              <Route path="platform/tenants" element={<TenantManagement />} />
              <Route path="platform/analytics" element={<PlatformAnalytics />} />
              <Route path="platform/subscription-plans" element={<SubscriptionPlans />} />
              <Route path="platform/subscription-payments" element={<PlatformSubscriptionVerification />} />
              <Route path="platform/settings" element={<PlatformPaymentSettings />} />
              
              {/* Tenant Admin - Payment Verification */}
              <Route path="payment-verification" element={<TenantPaymentVerification />} />
              
              {/* Subscription Upgrade Routes */}
              <Route path="subscription/status" element={<SubscriptionStatusPage />} />
              <Route path="subscription/upgrade" element={<SubscriptionUpgradePage />} />
            </Route>

            {/* Customer Routes */}
            <Route path="/customer" element={
              <PrivateRoute requiredRole="customer">
                <CustomerLayout />
              </PrivateRoute>
            }>
              <Route index element={<CustomerDashboard />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="profile/edit" element={<CustomerProfileEdit />} />
              <Route path="profile/change-password" element={<ChangePassword />} />
              <Route path="invoices" element={<CustomerInvoiceList />} />
              <Route path="invoices/:id" element={<CustomerInvoiceDetail />} />
              <Route path="payments/new" element={<CustomerPaymentForm />} />
              <Route path="payments/info" element={<CustomerPaymentInfo />} />
              <Route path="payments/confirm" element={<CustomerPaymentConfirmation />} />
              <Route path="payments/success" element={<PaymentSuccess />} />
              <Route path="usage" element={<CustomerUsageMonitor />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </Router>
          </ToastProvider>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

export default App;