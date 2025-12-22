import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600">404</h1>
        <p className="text-2xl font-semibold mt-4">Page Not Found</p>
        <p className="text-gray-600 mt-2">
          The page you are looking for does not exist.
        </p>
        <div className="mt-6">
          <Link
            to="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Admin Dashboard
          </Link>
          <Link
            to="/customer"
            className="ml-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Go to Customer Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
