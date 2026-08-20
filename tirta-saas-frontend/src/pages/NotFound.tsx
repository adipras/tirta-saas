import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md">
        {/* Icon Badge */}
        <div className="mx-auto inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25 mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 text-white" />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          404
        </h1>

        <p className="mt-4 text-xl font-semibold text-surface-900">
          Halaman Tidak Ditemukan
        </p>
        <p className="mt-2 text-[13px] text-surface-500 leading-relaxed">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          Silakan kembali ke dashboard atau periksa URL yang Anda masukkan.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/admin"
            className="btn-primary inline-flex items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Admin Dashboard
          </Link>
          <Link
            to="/customer"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Customer Dashboard
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-surface-400 hover:text-surface-600 transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Kembali ke halaman sebelumnya
        </button>
      </div>
    </div>
  );
};

export default NotFound;
