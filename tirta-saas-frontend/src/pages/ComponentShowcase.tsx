import { useState } from 'react';
import {
  Modal,
  ConfirmModal,
  useToast,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  Badge,
  StatusBadge,
  PaymentStatusBadge,
  CurrencyInput,
  CurrencyDisplay,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
} from '../components';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

/**
 * Component Showcase Page
 * Demonstrates all common components with examples
 * This page is for development/documentation purposes
 */
const ComponentShowcase = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: '',
    notes: '',
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Component Showcase</h1>
        <p className="text-gray-600">Interactive examples of all common components</p>
      </div>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Toast Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toast.success('Operation completed successfully!')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Success Toast
          </button>
          <button
            onClick={() => toast.error('An error occurred. Please try again.')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Error Toast
          </button>
          <button
            onClick={() => toast.warning('Please review before proceeding.')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Warning Toast
          </button>
          <button
            onClick={() => toast.info('New feature available!')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Info Toast
          </button>
        </div>
      </section>

      {/* Modals */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Modals</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Modal
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Open Confirm Dialog
          </button>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Example Modal" size="md">
          <div className="space-y-4">
            <p className="text-gray-700">This is an example modal with custom content.</p>
            <p className="text-gray-700">You can put any content here including forms, images, or other components.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success('Action completed!');
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            toast.success('Item deleted successfully!');
          }}
          title="Delete Confirmation"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Badges</h2>
        
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">With Dot</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>Active</Badge>
            <Badge variant="danger" dot>Inactive</Badge>
            <Badge variant="warning" dot>Pending</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Status Badges</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" />
            <StatusBadge status="inactive" />
            <StatusBadge status="pending" />
            <StatusBadge status="suspended" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Payment Status</h3>
          <div className="flex flex-wrap gap-2">
            <PaymentStatusBadge status="paid" />
            <PaymentStatusBadge status="unpaid" />
            <PaymentStatusBadge status="partial" />
            <PaymentStatusBadge status="overdue" />
            <PaymentStatusBadge status="void" />
          </div>
        </div>
      </section>

      {/* Currency */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Currency Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Currency Input</h3>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              currency="IDR"
              locale="id-ID"
              placeholder="Enter amount"
            />
            <p className="mt-2 text-sm text-gray-600">Current value: {amount}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Currency Display</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Small amount:</span>
                <CurrencyDisplay value={50000} className="font-semibold" />
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Large amount:</span>
                <CurrencyDisplay value={12500000} className="font-semibold" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Form Components</h2>
        
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <form className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              iconPosition="left"
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              helperText="We'll never share your email"
            />

            <FormInput
              label="Search"
              name="search"
              placeholder="Search..."
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
              iconPosition="left"
            />

            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
              placeholder="Select status"
              required
            />

            <FormTextarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Enter your notes here..."
            />

            <FormCheckbox
              label="I agree to the terms and conditions"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  toast.success('Form submitted successfully!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Loading Skeletons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Loading Skeletons</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Basic Skeleton</h3>
            <div className="space-y-2">
              <Skeleton height={20} />
              <Skeleton height={20} width="80%" />
              <Skeleton height={20} width="60%" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Card Skeleton</h3>
            <CardSkeleton />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Table Skeleton</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <TableSkeleton rows={3} cols={4} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComponentShowcase;
