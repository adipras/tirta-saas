import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { ToastProvider, ErrorBoundary, PrivateRoute } from './components';

import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminLogin from './pages/auth/AdminLogin';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerList from './pages/customers/CustomerList';
import UsageList from './pages/usage/UsageList';
import MeterReadingForm from './pages/usage/MeterReadingForm';
import UsageHistory from './pages/usage/UsageHistory';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceForm from './pages/invoices/InvoiceForm';
import InvoiceDetails from './pages/invoices/InvoiceDetails';
import SubscriptionTypeList from './pages/subscriptions/SubscriptionTypeList';
import SubscriptionTypeForm from './pages/subscriptions/SubscriptionTypeForm';
import WaterRateList from './pages/water-rates/WaterRateList';
import WaterRateForm from './pages/water-rates/WaterRateForm';
import RateHistory from './pages/water-rates/RateHistory';
import { PaymentList, PaymentForm, PaymentReceipt } from './pages/payments';
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
import { CustomerPaymentForm, PaymentSuccess } from './pages/customer-payments';
import { CustomerUsageMonitor } from './pages/customer-usage';
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
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            
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

            {/* Auth Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/customer/login" element={<CustomerLogin />} />
            
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
                  <Dashboard />
                </ErrorBoundary>
              } />
              <Route path="test" element={<TestPage />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<div>New Customer Form</div>} />
              <Route path="customers/:id" element={<div>Customer Details</div>} />
              <Route path="customers/:id/edit" element={<div>Edit Customer Form</div>} />
              <Route path="subscriptions" element={<SubscriptionTypeList />} />
              <Route path="subscriptions/create" element={<SubscriptionTypeForm />} />
              <Route path="subscriptions/edit/:id" element={<SubscriptionTypeForm />} />
              <Route path="water-rates" element={<WaterRateList />} />
              <Route path="water-rates/create" element={<WaterRateForm />} />
              <Route path="water-rates/edit/:id" element={<WaterRateForm />} />
              <Route path="water-rates/history" element={<RateHistory />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetails />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="payments" element={<PaymentList />} />
              <Route path="payments/new" element={<PaymentForm />} />
              <Route path="payments/:id/edit" element={<PaymentForm />} />
              <Route path="payments/:id/receipt" element={<PaymentReceipt />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="reports/revenue" element={<RevenueReport />} />
              <Route path="reports/customers" element={<CustomerAnalytics />} />
              <Route path="reports/payments" element={<PaymentReport />} />
              <Route path="reports/usage" element={<UsageReport />} />
              <Route path="reports/outstanding" element={<OutstandingReport />} />
              <Route path="settings" element={<div>Settings Page</div>} />
              <Route path="usage" element={<UsageList />} />
              <Route path="usage/create" element={<MeterReadingForm />} />
              <Route path="usage/edit/:id" element={<MeterReadingForm />} />
              <Route path="usage/:customerId/history" element={<UsageHistory />} />
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