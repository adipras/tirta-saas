# Testing & Bug Report - December 31, 2024

## Overview
**Testing Session:** End-to-End Testing of Water Management Operations
**Focus:** Frontend-Backend Integration
**Status:** 🔴 In Progress - Critical bugs found

---

## 🐛 Critical Bugs Found

### 1. **Water Rate Form - Subscription Types Dropdown Empty**
**Status:** ✅ FIXED
**Component:** `WaterRateForm.tsx`
**Issue:** Dropdown for subscription types was empty when creating new water rate
**Root Cause:** Frontend was filtering by `is_active` field, but backend model doesn't have this field
**Fix Applied:** Removed `.filter(t => t.is_active)` line in `fetchSubscriptionTypes()`
**Files Modified:**
- `tirta-saas-frontend/src/pages/water-rates/WaterRateForm.tsx`

---

### 2. **Customer Type Definition Mismatch**
**Status:** ✅ FIXED (Partially)
**Components:** Multiple customer-related components
**Issue:** Frontend type definitions don't match backend model
**Root Cause:** Backend uses snake_case and different fields than frontend expects

**Backend Model (Actual):**
```go
type Customer struct {
    MeterNumber    string           `json:"meter_number"`
    Name           string           `json:"name"`
    Email          string           `json:"email"`
    Password       string           `json:"-"`
    Address        string           `json:"address"`
    Phone          string           `json:"phone"`
    SubscriptionID uuid.UUID        `json:"subscription_id"`
    Subscription   SubscriptionType `json:"subscription"`
    IsActive       bool             `json:"is_active"`
    TenantID       uuid.UUID        `json:"tenant_id"`
}
```

**Frontend Type (Old - Wrong):**
```typescript
interface Customer {
  customerId: string;
  meterNumber?: string;
  city: string;
  postalCode: string;
  subscriptionType: SubscriptionType;
  status: CustomerStatus;
  registrationDate: string;
  lastPaymentDate?: string;
  outstandingBalance: number;
}
```

**Frontend Type (New - Correct):**
```typescript
interface Customer {
  id: string;
  meter_number: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_id: string;
  subscription: SubscriptionType;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
```

**Files Fixed:**
- `tirta-saas-frontend/src/types/customer.ts` ✅
- `tirta-saas-frontend/src/pages/customers/CustomerForm.tsx` ✅
- `tirta-saas-frontend/src/services/customerService.ts` ✅

**Files Still Need Fix:**
- `tirta-saas-frontend/src/pages/customers/CustomerList.tsx` ⏳
- `tirta-saas-frontend/src/pages/customers/CustomerDetails.tsx` ⏳
- `tirta-saas-frontend/src/pages/payments/PaymentForm.tsx` ⏳
- `tirta-saas-frontend/src/pages/usage/MeterReadingForm.tsx` ⏳
- `tirta-saas-frontend/src/pages/usage/UsageHistory.tsx` ⏳
- `tirta-saas-frontend/src/pages/usage/UsageList.tsx` ⏳

---

### 3. **CreateCustomerDto Missing Required Fields**
**Status:** ✅ FIXED
**Component:** Customer creation flow
**Issue:** Frontend was not sending required `password` field and using wrong field names
**Root Cause:** Backend requires `meter_number`, `password`, and `subscription_id` (snake_case)

**Backend Request (Actual):**
```go
type CreateCustomerRequest struct {
    MeterNumber    string    `json:"meter_number" binding:"required"`
    Name           string    `json:"name" binding:"required"`
    Email          string    `json:"email" binding:"required,email"`
    Password       string    `json:"password" binding:"required,min=6"`
    SubscriptionID uuid.UUID `json:"subscription_id" binding:"required"`
    Phone          string    `json:"phone,omitempty"`
    Address        string    `json:"address,omitempty"`
}
```

**Fix Applied:**
- Updated `CreateCustomerDto` interface to match backend
- Added `password` field to customer form (create mode only)
- Changed field names from camelCase to snake_case
- Removed non-existent fields (`city`, `postalCode`)

**Files Modified:**
- `tirta-saas-frontend/src/types/customer.ts` ✅
- `tirta-saas-frontend/src/pages/customers/CustomerForm.tsx` ✅

---

## 📊 Build Errors Summary

**Total Errors:** 24 TypeScript errors
**Affected Files:** 7 files

### Error Categories:

1. **Property 'status' does not exist (4 errors)**
   - Customer model uses `is_active` (boolean), not `status` (enum)
   - Files: CustomerDetails, CustomerList, PaymentForm, customerService

2. **Property 'customerId' does not exist (3 errors)**
   - Should use `id` field directly
   - Files: CustomerDetails, MeterReadingForm, UsageHistory, UsageList

3. **Property 'subscriptionType' → 'subscription' (3 errors)**
   - Field name changed from camelCase to snake_case
   - Files: CustomerDetails, MeterReadingForm

4. **Property 'meterNumber' → 'meter_number' (3 errors)**
   - Field name changed from camelCase to snake_case
   - Files: CustomerDetails, PaymentForm, MeterReadingForm

5. **Missing fields (11 errors)**
   - `city`, `postalCode`, `outstandingBalance`, `registrationDate`, `lastPaymentDate`
   - These fields don't exist in backend model
   - Files: CustomerDetails

---

## 🔍 Testing Plan

### Phase 1: Fix Critical Type Errors ⏳
- [ ] Fix CustomerList.tsx
- [ ] Fix CustomerDetails.tsx  
- [ ] Fix PaymentForm.tsx
- [ ] Fix MeterReadingForm.tsx
- [ ] Fix UsageHistory.tsx
- [ ] Fix UsageList.tsx
- [ ] Verify build passes (0 errors)

### Phase 2: Manual Testing - Customer Management ⏳
- [ ] Login as tenant admin
- [ ] Create new customer (with all required fields)
- [ ] Verify customer appears in list
- [ ] Edit customer details
- [ ] View customer details
- [ ] Activate/Deactivate customer
- [ ] Delete customer

### Phase 3: Manual Testing - Water Rate Management ⏳
- [ ] Create subscription type
- [ ] Create water rate for subscription type
- [ ] Verify dropdown shows subscription types
- [ ] Edit water rate
- [ ] Delete water rate

### Phase 4: Manual Testing - Usage Recording ⏳
- [ ] Select customer
- [ ] Record meter reading
- [ ] View usage history
- [ ] Edit usage record
- [ ] Calculate usage charges

### Phase 5: Manual Testing - Invoice Generation ⏳
- [ ] Generate invoice for customer
- [ ] View invoice details
- [ ] Bulk generate invoices
- [ ] Preview invoices before generation

### Phase 6: Manual Testing - Payment Processing ⏳
- [ ] Record payment for invoice
- [ ] Upload payment proof
- [ ] View payment history
- [ ] Generate payment receipt

---

## 🚧 Known Issues (Not Fixed Yet)

### High Priority
1. **Customer status management** - Need to determine if we use `is_active` boolean or add `status` enum
2. **Missing customer fields** - `outstandingBalance`, `lastPaymentDate` not in backend
3. **Filter by status** - Current filter uses `status` enum, need to adapt for `is_active`

### Medium Priority
4. **City and Postal Code** - Backend doesn't store these, frontend expects them
5. **Customer ID display** - Backend doesn't have separate `customerId` display field
6. **Meter number assignment** - Need to clarify if it's required or optional

### Low Priority
7. **Registration date** - Backend uses `created_at`, frontend expects `registrationDate`
8. **Subscription type casing** - Some places use camelCase, others snake_case

---

## 💡 Recommendations

### Immediate Actions
1. **Complete type fixes** - Fix all 7 remaining files with type errors
2. **Build verification** - Ensure `npm run build` passes with 0 errors
3. **Manual testing** - Test complete customer creation flow end-to-end

### Short Term
1. **API documentation** - Document actual API request/response structures
2. **Type generation** - Consider auto-generating TypeScript types from Go structs
3. **Integration tests** - Add automated tests for critical flows

### Long Term
1. **Schema validation** - Add runtime validation for API responses
2. **Error handling** - Improve error messages for type mismatches
3. **Developer docs** - Create guide for maintaining type consistency

---

## 📝 Notes

### Testing Environment
- **Backend:** Running on `localhost:8081`
- **Frontend:** Running on `localhost:5174`
- **Test User:** `admin@tirtautama.com` / `admin123`
- **Test Tenant:** Tirta Utama

### API Endpoints Tested
- ✅ `POST /api/auth/login` - Working
- ✅ `GET /api/subscription-types` - Working (returns array)
- ⏳ `GET /api/customers` - Pending test
- ⏳ `POST /api/customers` - Pending test

---

**Last Updated:** 2024-12-31 02:35 UTC
**Next Session:** Continue fixing remaining type errors
