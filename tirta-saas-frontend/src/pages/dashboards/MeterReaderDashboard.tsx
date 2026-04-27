import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  PageHeader,
  QuickActionCard,
} from '../../components';

export default function MeterReaderDashboard() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Catat Pembacaan Baru',
      description: 'Masukkan hasil pembacaan meter terbaru untuk pelanggan.',
      icon: PlusIcon,
      tone: 'blue' as const,
      onClick: () => navigate('/admin/usage/create'),
    },
    {
      title: 'Lihat Semua Pembacaan',
      description: 'Buka daftar pemakaian air untuk meninjau seluruh data meter.',
      icon: ClipboardDocumentListIcon,
      tone: 'green' as const,
      onClick: () => navigate('/admin/usage'),
    },
    {
      title: 'Pantau Riwayat Pelanggan',
      description: 'Gunakan daftar pemakaian untuk membuka histori pelanggan tertentu.',
      icon: ClockIcon,
      tone: 'indigo' as const,
      onClick: () => navigate('/admin/usage'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Petugas Meter"
        subtitle="Akses cepat untuk mencatat pembacaan, membuka daftar pemakaian, dan meninjau histori pelanggan dari tampilan yang ringkas di mobile."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Langkah Utama"
          value="Input Meter"
          helper="Mulai dari sini"
          subtitle="Catat hasil pembacaan meter baru sebelum data digunakan pada proses tagihan."
          icon={PlusIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pemeriksaan"
          value="Daftar Pemakaian"
          helper="Cek ulang data"
          subtitle="Tinjau pembacaan yang sudah masuk untuk memastikan data pelanggan sudah lengkap."
          icon={ClipboardDocumentListIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Riwayat"
          value="Histori Pelanggan"
          helper="Pantau tren"
          subtitle="Lihat pola pemakaian pelanggan saat perlu validasi atau tindak lanjut lapangan."
          icon={ClockIcon}
          tone="purple"
        />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
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
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-blue-900">Panduan singkat petugas meter</h2>
        <div className="mt-3 space-y-2 text-sm leading-6 text-blue-900">
          <p>1. Catat pembacaan meter terbaru segera setelah kunjungan lapangan selesai.</p>
          <p>2. Pastikan angka awal dan akhir meter masuk dengan benar sebelum menyimpan.</p>
          <p>3. Gunakan daftar pemakaian untuk memeriksa histori bila ada lonjakan atau anomali.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Aktivitas terbaru</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Belum ada aktivitas terbaru yang perlu ditampilkan di dashboard ini.
        </p>
      </section>
    </div>
  );
}
