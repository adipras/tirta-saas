import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowUpTrayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { PageHeader } from '../../components';
import { useToast } from '../../components';


interface RowEntry {
  meter_number: string;
  meter_end: string;
  notes: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

const EMPTY_ROW: RowEntry = { meter_number: '', meter_end: '', notes: '' };

export default function BulkImportWaterPemakaian() {
  const navigate = useNavigate();
  const toast = useToast();

  const [usageMonth, setPemakaianMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<RowEntry[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  const updateRow = (index: number, field: keyof RowEntry, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handlePasteCSV = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.trim();
    if (!text) return;
    const parsed: RowEntry[] = text.split('\n').map(line => {
      const parts = line.split('\t').map(p => p.trim());
      return {
        meter_number: parts[0] || '',
        meter_end: parts[1] || '',
        notes: parts[2] || '',
      };
    });
    setRows(parsed);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.meter_number && r.meter_end);
    if (!usageMonth) {
      toast.error('Pilih bulan pemakaian');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Tidak ada data yang valid untuk diimport');
      return;
    }

    setLoading(true);
    try {
      const records = validRows.map(r => ({
        meter_number: r.meter_number,
        meter_end: parseFloat(r.meter_end),
        notes: r.notes,
      }));

      const res = await usageService.bulkImportWaterPemakaian(usageMonth, records);
      setResult(res);

      // Mark row statuses
      const updatedRows = rows.map(r => {
        if (!r.meter_number) return r;
        const errEntry = res.errors?.find((e: any) => e.meter_number === r.meter_number);
        return errEntry
          ? { ...r, status: 'error' as const, error: errEntry.error }
          : { ...r, status: 'success' as const };
      });
      setRows(updatedRows);

      const msg = `Import selesai: ${res.success} berhasil, ${res.failed} gagal`;
      if (res.failed === 0) {
        toast.success(msg);
      } else {
        toast.warning(msg);
      }
    } catch (err: any) {
      toast.error(err.message || 'Import gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import Meter Reading"
        subtitle="Import data pembacaan meter banyak pelanggan sekaligus"
        actions={
          <button onClick={() => navigate('/admin/usage')} aria-label="Kembali ke halaman pemakaian" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        }
      />

      {/* Result summary */}
      {result && (
        <div className={`rounded-md p-4 ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className="text-sm font-medium">
            Hasil Import: <span className="text-green-700">{result.success} berhasil</span>
            {result.failed > 0 && <>, <span className="text-red-700">{result.failed} gagal</span></>}
            {' '}dari {result.total} data
          </p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Pemakaian Month */}
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Pemakaian</label>
          <input
            type="month"
            value={usageMonth}
            onChange={e => setPemakaianMonth(e.target.value)}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Paste CSV hint */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Atau paste data (tab-separated: no_meter, meter_akhir, catatan)
          </label>
          <textarea
            rows={3}
            onChange={handlePasteCSV}
            placeholder="000001&#9;1250&#9;Normal&#10;000002&#9;980&#9;"
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">No. Meter *</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Meter Akhir (m³) *</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Catatan</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-24">Status</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={i} className={row.status === 'error' ? 'bg-red-50' : row.status === 'success' ? 'bg-green-50' : ''}>
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.meter_number}
                      onChange={e => updateRow(i, 'meter_number', e.target.value)}
                      placeholder="000001"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={row.meter_end}
                      onChange={e => updateRow(i, 'meter_end', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={e => updateRow(i, 'notes', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {row.status === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {row.status === 'error' && (
                      <span title={row.error} className="flex items-center gap-1 text-red-600 text-xs">
                        <XCircleIcon className="h-4 w-4 flex-shrink-0" />{row.error}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(i)} aria-label="Hapus baris ini" className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Tambah baris
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/usage')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {loading ? 'Mengimport...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
