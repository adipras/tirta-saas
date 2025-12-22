import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import invoiceService from '../../services/invoiceService';
import customerService from '../../services/customerService';
import type { Customer } from '../../types/customer';
import type { Invoice, InvoiceItem } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

interface InvoiceFormData {
  customerId: string;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
  items: Partial<InvoiceItem>[];
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InvoiceFormData>({
    defaultValues: {
      status: 'unpaid',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    fetchCustomers();
    if (mode === 'edit' && id) {
      fetchInvoice(id);
    }
  }, [id, mode]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers(1, 100); // Fetch up to 100 customers
      setCustomers(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customers',
      }));
    }
  };

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      const formattedDate = invoice.dueDate.split('T')[0]; // Format date for input
      reset({
        ...invoice,
        dueDate: formattedDate,
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch invoice details',
      }));
      navigate('/admin/invoices');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setSaving(true);
      const itemsWithTotal = data.items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0),
      }));
      const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);

      const invoiceData: Partial<Invoice> = {
        ...data,
        amount: totalAmount,
      };

      if (mode === 'create') {
        await invoiceService.createInvoice(invoiceData);
        dispatch(addNotification({
          type: 'success',
          message: 'Invoice created successfully',
        }));
      } else if (id) {
        await invoiceService.updateInvoice(id, invoiceData);
        dispatch(addNotification({
          type: 'success',
          message: 'Invoice updated successfully',
        }));
      }

      navigate('/admin/invoices');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${mode} invoice`,
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Invoices
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
            </h3>

            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <select
                  {...register('customerId', { required: 'Customer is required' })}
                  id="customerId"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="mt-2 text-sm text-red-600">{errors.customerId.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date *
                </label>
                <input
                  {...register('dueDate', { required: 'Due date is required' })}
                  type="date"
                  id="dueDate"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                {errors.dueDate && <p className="mt-2 text-sm text-red-600">{errors.dueDate.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register('status')}
                  id="status"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Invoice Items</h4>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-4">
                  <input
                    {...register(`items.${index}.description`, { required: true })}
                    placeholder="Description"
                    className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                    type="number"
                    placeholder="Qty"
                    className="w-24 focus:ring-blue-500 focus:border-blue-500 block shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <input
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    className="w-32 focus:ring-blue-500 focus:border-blue-500 block shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/invoices')}
              className="bg-white border border-gray-300 rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (mode === 'create' ? 'Create Invoice' : 'Update Invoice')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
