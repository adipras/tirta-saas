import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';
import CustomerHeader from '../components/CustomerHeader';

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-gray-50">
      <CustomerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CustomerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="safe-bottom flex-1 overflow-x-clip overflow-y-auto bg-gray-50 px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
