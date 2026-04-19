import { useState, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Customer } from '../types/customer';

interface CustomerSearchSelectProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export default function CustomerSearchSelect({
  customers,
  value,
  onChange,
  disabled = false,
  error,
  label = 'Pelanggan',
  required = false,
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Find selected customer when value changes
  useEffect(() => {
    if (value) {
      const customer = customers.find((c) => c.id === value);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [value, customers]);

  // Filter customers by name or meter_number
  const filteredPelanggan =
    query === ''
      ? customers
      : customers.filter((customer) => {
          const searchQuery = query.toLowerCase();
          return (
            customer.name.toLowerCase().includes(searchQuery) ||
            (customer.meter_number?.toLowerCase() || '').includes(searchQuery)
          );
        });

  const handleChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    onChange(customer?.id || '');
  };

  return (
    <div className="w-full">
      <Combobox value={selectedCustomer} onChange={handleChange} disabled={disabled}>
        <Combobox.Label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Combobox.Label>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(customer: Customer | null) =>
                customer ? `${customer.name} (${customer.meter_number})` : ''
              }
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari berdasarkan nama atau nomor meter..."
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredPelanggan.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Tidak ada pelanggan ditemukan.</span>
                  </div>
                </div>
              ) : (
                filteredPelanggan.map((customer) => (
                  <Combobox.Option
                    key={customer.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={customer}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {customer.name}
                            </span>
                            {!customer.is_active && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                active ? 'bg-yellow-200 text-yellow-900' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <span className={`text-sm ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                            Meter: {customer.meter_number || 'N/A'}
                            {customer.subscription?.name && ` • ${customer.subscription.name}`}
                          </span>
                        </div>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-blue-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Nama:</span>
              <span className="ml-2 font-medium">{selectedCustomer.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Meter:</span>
              <span className="ml-2 font-medium">{selectedCustomer.meter_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Alamat:</span>
              <span className="ml-2 font-medium">{selectedCustomer.address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span
                className={`ml-2 font-medium ${
                  selectedCustomer.is_active ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {selectedCustomer.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
