import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  QuickActionCard,
} from '../../components';

export default function MeterReaderDashboard() {
  const navigate = useNavigate();

  const workflowSteps = [
    {
      title: 'Catat pembacaan',
      description: 'Input angka awal dan akhir meter segera setelah kunjungan lapangan.',
    },
    {
      title: 'Cek daftar pemakaian',
      description: 'Pastikan data yang baru masuk sudah lengkap dan sesuai pelanggan.',
    },
    {
      title: 'Validasi histori',
      description: 'Bandingkan dengan riwayat pelanggan bila ada lonjakan atau anomali.',
    },
  ];

  const quickActions = [
    {
      title: 'Catat Pembacaan Baru',
      description: 'Input hasil pembacaan meter terbaru pelanggan.',
      icon: PlusIcon,
      tone: 'blue' as const,
      onClick: () => navigate('/admin/usage/create'),
    },
    {
      title: 'Lihat Semua Pembacaan',
      description: 'Buka daftar pemakaian air seluruh pelanggan.',
      icon: ClipboardDocumentListIcon,
      tone: 'green' as const,
      onClick: () => navigate('/admin/usage'),
    },
    {
      title: 'Pantau Riwayat Pelanggan',
      description: 'Tinjau histori pemakaian pelanggan tertentu.',
      icon: ClockIcon,
      tone: 'indigo' as const,
      onClick: () => navigate('/admin/usage'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Dashboard Petugas Meter</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Dashboard ringkas untuk pencatatan meter harian tanpa informasi berulang.
        </p>
      </div>

      {/* Workflow */}
      <div className="card p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-[15px] font-semibold text-surface-800">Alur kerja pencatatan meter</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Ikuti tiga tahap ini secara berurutan agar data pemakaian tercatat rapi dan siap dipakai proses tagihan.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {workflowSteps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 sm:flex-col sm:gap-3">
              <div className="flex flex-shrink-0 flex-col items-center sm:w-full sm:flex-row">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
                  {index + 1}
                </span>
                {index < workflowSteps.length - 1 && (
                  <span
                    className="mt-1 w-px flex-1 bg-surface-200 sm:ml-3 sm:mt-0 sm:h-px sm:w-full"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="pb-2 sm:pb-0">
                <p className="text-[14px] font-medium text-surface-800">{step.title}</p>
                <p className="mt-1 text-[13px] text-surface-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Pintasan cepat</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">Klik salah satu kartu untuk langsung membuka halaman kerja.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              tone={action.tone}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
