import { useState } from 'react';
import { 
  CalendarIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface PreviewInvoice {
  invoice_number: string;
  customer_name: string;
  customer_code: string;
  usage_m3: number;
  water_charge: number;
  abonemen: number;
  penalty_amount: number;
  total_amount: number;
}

interface GenerationResult {
  status: string;
  message: string;
  success: number;
  skipped: number;
  failed: number;
  total_amount: number;
  invoices: PreviewInvoice[];
  errors: string[];
  preview_only: boolean;
}

const BulkInvoiceGeneration = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return lastMonth.toISOString().slice(0, 7); // YYYY-MM
  });
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<GenerationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices/preview-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tirta_access_token')}`,
        },
        body: JSON.stringify({
          usage_month: selectedMonth,
          customer_ids: [],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPreviewData(data);
        setShowPreview(true);
      } else {
        alert(`Error: ${data.message || 'Failed to preview invoices'}`);
      }
    } catch (error) {
      console.error('Error previewing:', error);
      alert('Failed to preview invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm(`Are you sure you want to generate ${previewData?.success || 0} invoices for ${selectedMonth}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/invoices/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tirta_access_token')}`,
        },
        body: JSON.stringify({
          usage_month: selectedMonth,
          customer_ids: [],
          preview: false,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setGenerationResult(data);
        setShowPreview(false);
        setPreviewData(null);
        alert(`Success! Generated ${data.success} invoices.`);
      } else {
        alert(`Error: ${data.message || 'Failed to generate invoices'}`);
      }
    } catch (error) {
      console.error('Error generating:', error);
      alert('Failed to generate invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Invoice Generation</h1>
        <p className="mt-2 text-sm text-gray-700">
          Generate monthly invoices for all customers in bulk
        </p>
      </div>

      {/* Selection Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              max={new Date().toISOString().slice(0, 7)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Select the month for which you want to generate invoices
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePreview}
              disabled={loading || !selectedMonth}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Preview Invoices'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {showPreview && previewData && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Preview Results - {selectedMonth}
            </h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Will Generate</div>
              <div className="text-2xl font-bold text-green-700">{previewData.success}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Will Skip</div>
              <div className="text-2xl font-bold text-yellow-700">{previewData.skipped}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Failed</div>
              <div className="text-2xl font-bold text-red-700">{previewData.failed}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(previewData.total_amount)}
              </div>
            </div>
          </div>

          {/* Invoice List Preview */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Invoice Preview ({previewData.invoices.length} items)
            </h3>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Usage (m³)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Water Charge
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Penalty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.invoices.slice(0, 50).map((inv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{inv.invoice_number}</td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">{inv.customer_name}</div>
                        <div className="text-xs text-gray-500">{inv.customer_code}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {inv.usage_m3.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {formatCurrency(inv.water_charge)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {inv.penalty_amount > 0 ? (
                          <span className="text-red-600">{formatCurrency(inv.penalty_amount)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.invoices.length > 50 && (
                <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                  ... and {previewData.invoices.length - 50} more invoices
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {previewData.errors && previewData.errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                <ExclamationCircleIcon className="h-5 w-5 inline mr-1" />
                Errors ({previewData.errors.length})
              </h4>
              <ul className="text-xs text-red-700 space-y-1">
                {previewData.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
                {previewData.errors.length > 10 && (
                  <li>... and {previewData.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || previewData.success === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="h-5 w-5 inline mr-2" />
              Generate {previewData.success} Invoices
            </button>
          </div>
        </div>
      )}

      {/* Generation Result */}
      {generationResult && !showPreview && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invoices Generated Successfully!
            </h2>
            <p className="text-gray-600 mb-6">{generationResult.message}</p>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Generated</div>
                <div className="text-2xl font-bold text-green-700">{generationResult.success}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Skipped</div>
                <div className="text-2xl font-bold text-yellow-700">{generationResult.skipped}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-2xl font-bold text-red-700">{generationResult.failed}</div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setGenerationResult(null);
                  setSelectedMonth(() => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return lastMonth.toISOString().slice(0, 7);
                  });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate for Another Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      {!showPreview && !generationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Select the month for which you want to generate invoices</li>
                <li>Click "Preview" to see what invoices will be generated</li>
                <li>Review the preview and click "Generate" to create the invoices</li>
                <li>Invoices will be automatically numbered and include late payment penalties if applicable</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkInvoiceGeneration;
