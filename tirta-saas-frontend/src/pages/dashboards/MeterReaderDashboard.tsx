import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  PageHeader,
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
      description: 'Klik untuk input hasil pembacaan meter terbaru pelanggan.',
      icon: PlusIcon,
      tone: 'blue' as const,
      onClick: () => navigate('/admin/usage/create'),
    },
    {
      title: 'Lihat Semua Pembacaan',
      description: 'Klik untuk membuka daftar pemakaian air seluruh pelanggan.',
      icon: ClipboardDocumentListIcon,
      tone: 'green' as const,
      onClick: () => navigate('/admin/usage'),
    },
    {
      title: 'Pantau Riwayat Pelanggan',
      description: 'Klik untuk meninjau histori pemakaian pelanggan tertentu.',
      icon: ClockIcon,
      tone: 'indigo' as const,
      onClick: () => navigate('/admin/usage'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Petugas Meter"
        subtitle="Dashboard ringkas untuk membantu pencatatan meter harian tanpa informasi berulang."
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Alur kerja pencatatan meter</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Ikuti tiga tahap ini secara berurutan agar data pemakaian tercatat rapi dan siap dipakai proses tagihan.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {workflowSteps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 sm:flex-col sm:gap-3">
              <div className="flex flex-shrink-0 flex-col items-center sm:w-full sm:flex-row">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                {index < workflowSteps.length - 1 && (
                  <span
                    className="mt-1 w-px flex-1 bg-gray-200 sm:ml-3 sm:mt-0 sm:h-px sm:w-full"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="pb-2 sm:pb-0">
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Pintasan cepat</h2>
          <p className="mt-1 text-sm text-gray-500">Klik salah satu kartu untuk langsung membuka halaman kerja.</p>
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
      </section>
    </div>
  );
}
