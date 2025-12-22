import { Outlet } from 'react-router-dom';
import CustomerSidebar from '../components/CustomerSidebar';
import CustomerHeader from '../components/CustomerHeader';

const CustomerLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CustomerHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;