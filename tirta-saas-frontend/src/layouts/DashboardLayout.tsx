import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
  console.log('=== DashboardLayout Rendering ===');
  console.log('DashboardLayout is rendering the layout...');
  
  return (
    <div className="flex h-screen bg-gray-50" style={{ border: '5px solid blue' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;