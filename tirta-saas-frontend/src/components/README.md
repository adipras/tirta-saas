# Common Components Documentation

This directory contains reusable UI components for the Tirta SaaS application.

## Components Overview

### 1. Modal & ConfirmModal
Flexible modal dialogs for displaying content and confirmations.

**Features:**
- Multiple sizes (sm, md, lg, xl, full)
- Close on overlay click or Escape key
- Optional close button
- Confirmation modal with different types (danger, warning, info, success)
- Loading state support

**Usage:**
```tsx
import { Modal, ConfirmModal } from '@/components';

// Basic Modal
<Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" size="lg">
  <p>Modal content here</p>
</Modal>

// Confirm Modal
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Customer"
  message="Are you sure you want to delete this customer? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  type="danger"
/>
```

---

### 2. Toast Notification System
Global notification system with multiple types and auto-dismiss.

**Features:**
- 4 types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual dismiss
- Animated entry/exit
- Stacked notifications

**Usage:**
```tsx
import { useToast } from '@/components';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Customer created successfully!');
  };

  const handleError = () => {
    toast.error('Failed to save changes', 8000); // 8 seconds
  };

  const handleWarning = () => {
    toast.warning('Please review the changes');
  };

  const handleInfo = () => {
    toast.info('New feature available!');
  };

  return <button onClick={handleSuccess}>Save</button>;
}
```

**Note:** ToastProvider must be wrapped in App.tsx (already configured).

---

### 3. Loading Skeletons
Skeleton loaders for better loading UX.

**Components:**
- `Skeleton` - Basic skeleton with customizable size/shape
- `TableSkeleton` - For data tables
- `CardSkeleton` - For card layouts
- `ListSkeleton` - For lists
- `FormSkeleton` - For forms
- `DashboardSkeleton` - For dashboard layouts

**Usage:**
```tsx
import { TableSkeleton, CardSkeleton, Skeleton } from '@/components';

// Table loading
{isLoading ? <TableSkeleton rows={5} cols={4} /> : <DataTable data={data} />}

// Card loading
{isLoading ? <CardSkeleton /> : <CustomerCard customer={customer} />}

// Custom skeleton
<Skeleton width={200} height={40} circle />
```

---

### 4. Badge
Status and label badges with predefined variants.

**Features:**
- Multiple variants: default, primary, secondary, success, danger, warning, info
- Multiple sizes: xs, sm, md, lg
- Optional dot indicator
- Rounded option
- Predefined status badges

**Usage:**
```tsx
import { Badge, StatusBadge, PaymentStatusBadge } from '@/components';

// Basic badge
<Badge variant="success" size="sm" dot>Active</Badge>

// Status badge
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="suspended" />

// Payment status badge
<PaymentStatusBadge status="paid" />
<PaymentStatusBadge status="overdue" />
```

---

### 5. CurrencyInput & CurrencyDisplay
Components for handling Indonesian Rupiah (IDR) input and display.

**Features:**
- Auto-formatting with locale
- Numeric input validation
- Min/Max validation
- Display component for read-only values

**Usage:**
```tsx
import { CurrencyInput, CurrencyDisplay } from '@/components';

// Input
<CurrencyInput
  value={amount}
  onChange={setAmount}
  currency="IDR"
  locale="id-ID"
  min={0}
  max={1000000000}
  error={errors.amount}
/>

// Display
<CurrencyDisplay value={12500000} currency="IDR" locale="id-ID" />
// Output: Rp12.500.000
```

---

### 6. Enhanced Form Components
Form inputs with built-in label, error, and helper text support.

**Components:**
- `FormInput` - Text input with icon support
- `FormTextarea` - Multi-line text input
- `FormSelect` - Dropdown select
- `FormCheckbox` - Checkbox with label

**Features:**
- Built-in label and required indicator
- Error message display
- Helper text support
- Icon support (left/right)
- Full width option
- Forward ref support

**Usage:**
```tsx
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '@/components';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Text Input
<FormInput
  label="Customer Name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
  error={errors.name}
  helperText="Enter the full name"
/>

// Input with icon
<FormInput
  label="Search"
  icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
  iconPosition="left"
  placeholder="Search customers..."
/>

// Textarea
<FormTextarea
  label="Notes"
  name="notes"
  rows={4}
  value={formData.notes}
  onChange={handleChange}
/>

// Select
<FormSelect
  label="Status"
  name="status"
  value={formData.status}
  onChange={handleChange}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
  placeholder="Select status"
  required
/>

// Checkbox
<FormCheckbox
  label="I agree to terms and conditions"
  name="agree"
  checked={formData.agree}
  onChange={handleChange}
/>
```

---

## DataTable Component
Already exists - Enhanced table with sorting, filtering, and pagination.

## PrivateRoute Component
Already exists - Route protection with role-based access control.

---

## Best Practices

1. **Modal**: Always provide a close handler and consider keyboard navigation
2. **Toast**: Use appropriate types (success for actions, error for failures)
3. **Skeleton**: Match skeleton structure to actual content layout
4. **Badge**: Use consistent variants for status across the app
5. **CurrencyInput**: Always set min/max bounds for financial inputs
6. **FormInput**: Provide helpful error messages and validation

---

## Styling Guidelines

All components use TailwindCSS with consistent:
- Color palette: blue (primary), red (danger), green (success), yellow (warning)
- Spacing: 4px base unit
- Border radius: rounded (4px), rounded-md (6px), rounded-lg (8px)
- Shadows: shadow-sm, shadow, shadow-lg
- Focus rings: 2px with appropriate color

---

## TypeScript Support

All components are fully typed with:
- Props interfaces exported
- Generic support where applicable
- Forward ref support for form components
- Proper event typing

---

## Accessibility

Components follow accessibility best practices:
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML

---

## Future Enhancements

- [ ] DatePicker component
- [ ] DateRangePicker component
- [ ] Autocomplete component
- [ ] File upload component
- [ ] Pagination component
- [ ] Breadcrumb component
- [ ] Alert component
- [ ] Tooltip component
- [ ] Popover component
- [ ] Dropdown menu component
