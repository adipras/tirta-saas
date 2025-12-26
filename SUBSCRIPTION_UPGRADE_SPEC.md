# Subscription Upgrade Feature Specification

**Created:** December 26, 2024  
**Status:** PHASE 1 BACKEND COMPLETE (50%)  
**Priority:** HIGH (Required for Production)  
**Last Updated:** December 26, 2024 20:45 WIB

---

## 📋 Overview

Saat ini tenant registration langsung memberikan status **TRIAL** (14 hari) tanpa proses pembayaran subscription. Setelah trial berakhir atau sebelum berakhir, tenant perlu melakukan upgrade ke paid subscription.

### Current State:
- ✅ Tenant registration → Auto TRIAL status (14 days)
- ❌ No subscription selection during registration
- ❌ No payment submission during registration
- ❌ No upgrade UI/flow for trial tenants
- ❌ No reminder when trial is about to expire

### Target State:
- ✅ Tenant registration → TRIAL status (14 days)
- ✅ Upgrade button/banner always visible during trial
- ✅ Subscription plan selection
- ✅ Payment submission with proof upload
- ✅ Platform owner payment verification
- ✅ Auto-activation after payment verification
- ✅ Trial expiry reminder notification

---

## 🎯 User Stories

### 1. As a Trial Tenant Admin
- I want to see a clear indicator that I'm on trial period
- I want to know how many days remaining in my trial
- I want to easily upgrade to paid subscription before trial expires
- I want to select subscription plan (BASIC/PRO/ENTERPRISE)
- I want to see payment instructions clearly
- I want to submit proof of payment
- I want to track my payment verification status

### 2. As a Platform Owner
- I want to see list of pending subscription payments
- I want to verify tenant subscription payments
- I want to approve/reject payment submissions
- I want the system to auto-activate tenant after payment approval
- I want to send reminders to trial tenants nearing expiration

---

## 📐 Feature Requirements

### A. Trial Status Indicator (Tenant Side)

#### A1. Header/Topbar Banner
**Location:** Global header/topbar (visible on all pages during trial)

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ TRIAL MODE - 12 days remaining                          │
│ Upgrade Now to continue using full features  [Upgrade] [×] │
└─────────────────────────────────────────────────────────────┘
```

**Properties:**
- Background: Yellow/Orange gradient (warning color)
- Icon: Warning icon
- Text: "TRIAL MODE - X days remaining"
- CTA Button: "Upgrade Now" (primary color)
- Dismissible: Close button (but reappears next session)
- Persistence: Show on every page during trial

**Behavior:**
- Show when status = "TRIAL"
- Calculate days remaining from trial_end_date
- Change color to RED when < 3 days remaining
- Click "Upgrade Now" → Navigate to `/subscription/upgrade`
- Dismiss (×) → Hide for current session only

#### A2. Dashboard Card
**Location:** Main dashboard page

**Design:**
```
┌─────────────────────────────────────────┐
│  Your Subscription Status               │
├─────────────────────────────────────────┤
│  Status: TRIAL                          │
│  Started: Dec 20, 2024                  │
│  Expires: Jan 3, 2025                   │
│  Days Remaining: 12 days                │
│                                         │
│  [Upgrade to Premium]                   │
└─────────────────────────────────────────┘
```

**Properties:**
- Card style with icon
- Progress bar showing trial period
- Clear CTA button

#### A3. Sidebar Badge
**Location:** Next to tenant name in sidebar

**Design:**
```
PDAM Desa Sukamaju [TRIAL]
```

**Properties:**
- Badge: Orange/Yellow background
- Text: "TRIAL"
- Position: Next to organization name

---

### B. Upgrade Subscription Flow

#### B1. Upgrade Page - Step 1: Plan Selection
**URL:** `/subscription/upgrade`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│                  Upgrade Your Subscription                    │
│              Choose the plan that fits your needs             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  BASIC   │    │   PRO    │    │ ENTERPRISE│              │
│  │          │    │          │    │           │              │
│  │ Rp 500K  │    │ Rp 1.5M  │    │ Rp 3M     │              │
│  │ /month   │    │ /month   │    │ /month    │              │
│  │          │    │          │    │           │              │
│  │ • Up to  │    │ • Up to  │    │ • Unlimited│             │
│  │   100    │    │   500    │    │   customers│             │
│  │   cust.  │    │   cust.  │    │           │              │
│  │ • Basic  │    │ • Priority│   │ • Dedicated│             │
│  │   support│    │   support│    │   support │             │
│  │          │    │ • Reports│    │ • Custom  │             │
│  │          │    │          │    │   features│             │
│  │          │    │          │    │           │             │
│  │ [Select] │    │ [Select] │    │ [Select]  │             │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Fields:**
- Plan selection (radio/card selection)
- Display pricing clearly
- Display features comparison
- Billing period selection (1 month, 3 months, 6 months, 12 months)
- Apply discount for longer periods (optional)

**Validation:**
- Must select one plan
- Must select billing period

**Next:** Navigate to Step 2 (Payment)

---

#### B2. Upgrade Page - Step 2: Payment Information
**URL:** `/subscription/upgrade/payment`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│               Complete Your Payment                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Selected Plan: PRO                                           │
│  Billing Period: 1 Month                                      │
│  Amount: Rp 1,500,000                                         │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  Payment Methods                                              │
│                                                               │
│  Bank Transfer:                                               │
│  ┌─────────────────────────────────────────┐                │
│  │ Bank BCA                                 │                │
│  │ Account: 1234567890                      │                │
│  │ Name: PT Tirta SaaS Indonesia            │                │
│  │                              [Copy]      │                │
│  └─────────────────────────────────────────┘                │
│                                                               │
│  E-Wallet (QRIS):                                             │
│  ┌──────────┐                                                │
│  │ [QR Code]│                                                │
│  │  Image   │                                                │
│  └──────────┘                                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  Payment Confirmation                                         │
│                                                               │
│  Payment Date: [Date Picker] *                               │
│  Payment Method: [Dropdown] * (Bank Transfer/E-Wallet/etc)  │
│  Account Number: [Input] (if bank transfer)                  │
│  Account Name: [Input]                                        │
│  Reference Number: [Input]                                    │
│  Amount Paid: [Input] * (pre-filled, read-only)             │
│                                                               │
│  Proof of Payment: *                                          │
│  [Upload File] (JPG, PNG, PDF - Max 5MB)                    │
│  [Preview uploaded file]                                      │
│                                                               │
│  Notes: [Textarea] (optional)                                │
│                                                               │
│  [ ] I confirm that I have completed the payment             │
│                                                               │
│  [Cancel]                          [Submit Payment]          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Fields:**
- Payment date (date picker)
- Payment method (dropdown)
- Account number (if bank transfer)
- Account name
- Reference number
- Amount paid (read-only, auto-filled)
- Proof upload (file input)
- Notes (textarea)
- Confirmation checkbox

**Validation:**
- All required fields must be filled
- Payment date cannot be future date
- File size max 5MB
- File type: JPG, PNG, PDF only
- Must check confirmation checkbox

**Submission:**
- POST to `/api/platform/subscription-payments`
- Include file upload (multipart/form-data)
- Return payment confirmation ID

**Success:**
- Show success message
- Display payment confirmation ID
- Show "Payment under review" status
- Navigate to subscription status page

---

#### B3. Subscription Status Page
**URL:** `/subscription/status`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│               Your Subscription Status                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Current Status: TRIAL                                        │
│  Trial Expires: Jan 3, 2025 (12 days remaining)              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  Pending Subscription Payment                                 │
│                                                               │
│  Payment ID: #SUB-20241226-001                               │
│  Plan: PRO                                                    │
│  Amount: Rp 1,500,000                                        │
│  Submitted: Dec 26, 2024 10:30 AM                            │
│  Status: PENDING VERIFICATION                                 │
│                                                               │
│  ⏳ Your payment is being verified by our team.              │
│     You will be notified once verified.                       │
│                                                               │
│  [View Payment Details]                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Display:**
- Current subscription status
- Trial expiry information
- Pending payment details (if any)
- Payment status badge
- Link to view full payment details

---

### C. Platform Owner - Subscription Payment Verification

#### C1. Subscription Payments List
**URL:** `/platform/subscription-payments`

**Already Implemented:** `/platform-payments/verification` exists but needs integration

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Subscription Payment Verification                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Search...]                    [Filter: All ▼] [Status ▼]  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Tenant Name      │ Plan │ Amount    │ Date     │Status││ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ PDAM Sukamaju    │ PRO  │ 1,500,000 │ Dec 26   │⏳    ││ │
│  │ RT 01 RW 05      │ BASIC│   500,000 │ Dec 25   │⏳    ││ │
│  │ Desa Makmur      │ ENT  │ 3,000,000 │ Dec 24   │✓     ││ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Actions: View | Verify | Reject]                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- List all subscription payment submissions
- Filter by status (pending/verified/rejected)
- Search by tenant name
- Sort by date
- Quick actions (view/verify/reject)

---

#### C2. Payment Verification Modal
**Triggered:** Click "Verify" on pending payment

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Verify Subscription Payment                            [×]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Tenant: PDAM Desa Sukamaju                                  │
│  Plan: PRO                                                    │
│  Period: 1 Month                                              │
│  Amount: Rp 1,500,000                                        │
│                                                               │
│  Payment Details:                                             │
│  - Date: Dec 26, 2024                                        │
│  - Method: Bank Transfer (BCA)                               │
│  - Account: 1234567890 (Admin Sukamaju)                     │
│  - Reference: TRX-20241226-001                               │
│                                                               │
│  Payment Proof:                                               │
│  ┌────────────────┐                                          │
│  │  [Image/PDF]   │                                          │
│  │   Preview      │                                          │
│  └────────────────┘                                          │
│  [View Full Size]                                             │
│                                                               │
│  Verification Notes: [Textarea] (optional)                   │
│                                                               │
│  Actions:                                                     │
│  [Cancel]           [Reject]           [Verify & Activate]   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Verify Action:**
- Update payment status to "VERIFIED"
- Update tenant status from "TRIAL" to "ACTIVE"
- Set subscription_plan, subscription_start, subscription_end
- Calculate subscription_end based on billing period
- Send notification to tenant admin (email/in-app)
- Log the action with timestamp and verifier

**Reject Action:**
- Show rejection reason modal
- Update payment status to "REJECTED"
- Keep tenant status as "TRIAL"
- Send notification to tenant with rejection reason
- Allow tenant to resubmit

---

### D. Backend API Requirements

#### D1. Subscription Payment Endpoints

**POST `/api/platform/subscription-payments`**
```typescript
// Submit subscription payment
interface SubmitSubscriptionPayment {
  tenantId: string;
  subscriptionPlan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  billingPeriod: number; // in months
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  accountNumber?: string;
  accountName: string;
  referenceNumber: string;
  proofFile: File; // multipart upload
  notes?: string;
}

Response: {
  id: string;
  confirmationId: string;
  status: 'pending';
  message: string;
}
```

**GET `/api/platform/subscription-payments`**
```typescript
// Get all subscription payments (Platform Owner only)
Query params:
- status?: 'pending' | 'verified' | 'rejected'
- tenantId?: string
- page?: number
- limit?: number

Response: {
  data: SubscriptionPayment[];
  total: number;
  page: number;
  limit: number;
}
```

**GET `/api/platform/subscription-payments/:id`**
```typescript
// Get subscription payment details
Response: {
  id: string;
  tenant: TenantInfo;
  subscriptionPlan: string;
  billingPeriod: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
  referenceNumber: string;
  proofUrl: string;
  status: string;
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}
```

**PUT `/api/platform/subscription-payments/:id/verify`**
```typescript
// Verify subscription payment
Body: {
  notes?: string;
}

Response: {
  success: true;
  message: string;
  tenant: {
    id: string;
    status: 'active';
    subscriptionPlan: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
  }
}

// Side effects:
// 1. Update payment status to 'verified'
// 2. Update tenant status to 'active'
// 3. Set subscription fields in tenant
// 4. Send notification to tenant
```

**PUT `/api/platform/subscription-payments/:id/reject`**
```typescript
// Reject subscription payment
Body: {
  reason: string; // required
}

Response: {
  success: true;
  message: string;
}

// Side effects:
// 1. Update payment status to 'rejected'
// 2. Keep tenant status as 'trial'
// 3. Send notification to tenant with reason
```

**GET `/api/tenant/subscription/status`**
```typescript
// Get current tenant subscription status (Tenant Admin)
Response: {
  status: 'trial' | 'active' | 'expired' | 'suspended';
  subscriptionPlan?: string;
  trialEndDate?: Date;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  daysRemaining: number;
  pendingPayment?: {
    id: string;
    status: string;
    submittedAt: Date;
  }
}
```

---

#### D2. Database Schema Updates

**subscription_payments table (NEW)**
```sql
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_plan VARCHAR(50) NOT NULL, -- 'BASIC', 'PRO', 'ENTERPRISE'
  billing_period INTEGER NOT NULL, -- in months
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  account_number VARCHAR(100),
  account_name VARCHAR(255) NOT NULL,
  reference_number VARCHAR(255),
  proof_url VARCHAR(500) NOT NULL,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_payments_tenant ON subscription_payments(tenant_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
```

**tenants table (UPDATE)**
```sql
-- Add subscription fields if not exist
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_start DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_end DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_period INTEGER;

-- Update status enum to include 'expired'
ALTER TABLE tenants ALTER COLUMN status TYPE VARCHAR(50);
-- Values: 'trial', 'active', 'inactive', 'suspended', 'expired'
```

---

### E. Trial Expiry Management

#### E1. Automatic Status Update (Cron Job)

**Schedule:** Run daily at midnight

**Logic:**
```typescript
async function checkAndUpdateExpiredTrials() {
  const today = new Date();
  
  // Find all trial tenants where trial_end_date < today
  const expiredTrials = await db.query(`
    SELECT id, organization_name, trial_end_date 
    FROM tenants 
    WHERE status = 'trial' 
    AND trial_end_date < $1
  `, [today]);
  
  for (const tenant of expiredTrials) {
    // Update status to 'expired'
    await db.query(`
      UPDATE tenants 
      SET status = 'expired', updated_at = NOW() 
      WHERE id = $1
    `, [tenant.id]);
    
    // Send notification to admin
    await sendExpiryNotification(tenant);
    
    // Log the change
    console.log(`Tenant ${tenant.organization_name} trial expired`);
  }
}
```

#### E2. Trial Expiry Reminder (Cron Job)

**Schedule:** Run daily at 9:00 AM

**Logic:**
```typescript
async function sendTrialExpiryReminders() {
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  // Find trial tenants expiring in 3 days
  const expiringTrials = await db.query(`
    SELECT t.id, t.organization_name, t.trial_end_date, u.email 
    FROM tenants t
    JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
    WHERE t.status = 'trial' 
    AND t.trial_end_date = $1
  `, [threeDaysFromNow]);
  
  for (const tenant of expiringTrials) {
    await sendReminderEmail(tenant.email, {
      tenantName: tenant.organization_name,
      daysRemaining: 3,
      expiryDate: tenant.trial_end_date
    });
  }
}
```

#### E3. Access Control for Expired Tenants

**Middleware:** Check tenant status before allowing access

```typescript
async function checkTenantStatus(req, res, next) {
  const user = req.user;
  
  if (user.role === 'tenant_admin') {
    const tenant = await getTenant(user.tenant_id);
    
    if (tenant.status === 'expired') {
      return res.status(403).json({
        error: 'Your trial period has expired. Please upgrade to continue.',
        redirectTo: '/subscription/upgrade'
      });
    }
    
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
      });
    }
  }
  
  next();
}
```

---

### F. Frontend Components to Create

#### F1. Components List
1. `TrialBanner.tsx` - Top banner showing trial status
2. `SubscriptionStatusCard.tsx` - Dashboard card
3. `PlanSelectionPage.tsx` - Step 1: Choose plan
4. `PaymentSubmissionPage.tsx` - Step 2: Submit payment
5. `SubscriptionStatusPage.tsx` - View current status
6. `PlatformSubscriptionVerification.tsx` - Already exists, needs integration
7. `UpgradeButton.tsx` - Reusable CTA button
8. `TrialExpiryModal.tsx` - Modal when trial about to expire

#### F2. Routing Updates

**Add to `App.tsx`:**
```typescript
// Tenant routes
<Route path="/subscription/upgrade" element={<PrivateRoute><PlanSelectionPage /></PrivateRoute>} />
<Route path="/subscription/payment" element={<PrivateRoute><PaymentSubmissionPage /></PrivateRoute>} />
<Route path="/subscription/status" element={<PrivateRoute><SubscriptionStatusPage /></PrivateRoute>} />

// Platform routes (already exists, verify integration)
<Route path="/platform/subscription-payments" element={<PrivateRoute><PlatformSubscriptionVerification /></PrivateRoute>} />
```

---

## 📊 Implementation Priority

### Phase 1: Critical (Must Have for Production) - **BACKEND COMPLETE ✅**
1. ✅ Database schema for subscription_payments - **DONE**
2. ✅ Subscription payment model - **DONE**
3. ✅ Request/Response DTOs - **DONE**
4. ✅ Payment submission endpoint - **DONE**
5. ✅ Subscription status API endpoint - **DONE**
6. ✅ Platform payment verification endpoints - **DONE**
7. ✅ Verify & activate functionality - **DONE**
8. ⏳ Trial banner component (always visible) - **FRONTEND TODO**
9. ⏳ Plan selection page - **FRONTEND TODO**
10. ⏳ Payment submission page - **FRONTEND TODO**
11. ⏳ Platform payment verification UI - **FRONTEND TODO**
12. ⏳ Trial expiry cron job - **TODO**

### Phase 2: Important (Should Have)
1. ⚠️ Trial expiry reminder emails
2. ⚠️ Access control for expired tenants
3. ⚠️ Subscription status page
4. ⚠️ In-app notifications
5. ⚠️ Payment history for tenant

### Phase 3: Nice to Have
1. 💡 Billing discounts for longer periods
2. 💡 Invoice generation for subscriptions
3. 💡 Auto-renewal reminders
4. 💡 Subscription analytics
5. 💡 Multiple payment retries

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Subscription payment creation
- [ ] Payment verification logic
- [ ] Trial expiry calculation
- [ ] Status update transitions

### Integration Tests
- [ ] Full upgrade flow (trial → payment → active)
- [ ] Payment verification by platform owner
- [ ] Trial expiry triggers status change
- [ ] Access denied for expired tenants

### Manual Testing
- [ ] Tenant can see trial banner
- [ ] Tenant can submit payment
- [ ] Platform owner can verify payment
- [ ] Status updates correctly after verification
- [ ] Trial expires after 14 days
- [ ] Reminder sent 3 days before expiry

---

## 📝 Notes

1. **File Upload:** Payment proofs should be stored in `/uploads/subscription-proofs/` directory
2. **Security:** Ensure only platform owners can verify payments
3. **Notifications:** Implement email service for reminders and confirmations
4. **Logging:** Log all subscription status changes for audit trail
5. **Error Handling:** Graceful handling if payment verification fails

---

## 🚀 Next Steps

1. Review and approve this specification
2. Create detailed task breakdown in Jira/Trello
3. Estimate development time (estimated: 3-5 days)
4. Implement backend APIs first
5. Implement frontend components
6. Integration testing
7. UAT with stakeholders
8. Deploy to production

---

## 🎉 Implementation Progress (December 26, 2024)

### ✅ Backend Implementation (COMPLETE - 2 hours)

**Files Created:**
1. `models/subscription_payment.go` (49 lines) - Payment submission model
2. `requests/subscription_payment_request.go` (27 lines) - Request DTOs
3. `responses/subscription_payment_response.go` (68 lines) - Response DTOs
4. `controllers/subscription_payment_controller.go` (389 lines) - 6 controllers
5. `routes/subscription_payment.go` (19 lines) - Route registration

**Endpoints Implemented:**
- `POST /api/tenant/subscription/payment` - Tenant submits payment
- `GET /api/tenant/subscription/status` - Get current subscription status
- `GET /api/platform/subscription-payments` - List all payments (Platform Owner)
- `GET /api/platform/subscription-payments/:id` - Payment detail
- `PUT /api/platform/subscription-payments/:id/verify` - Verify & activate
- `PUT /api/platform/subscription-payments/:id/reject` - Reject payment

**Database Changes:**
- Added `subscription_payments` table to migration
- Upload directory created: `uploads/subscription-proofs/`

**Features Implemented:**
- File upload for payment proof (max 5MB)
- Transaction-safe payment verification
- Automatic tenant activation after verification
- Subscription period calculation
- Pending payment tracking
- Days remaining calculation

### ⏳ Remaining Work (Frontend - Estimated 4-5 hours)

**Components to Build:**
1. `TrialBanner.tsx` - Global trial status banner (~1 hour)
2. `SubscriptionUpgrade/PlanSelection.tsx` - Plan selection page (~1.5 hours)
3. `SubscriptionUpgrade/PaymentSubmission.tsx` - Payment form with file upload (~2 hours)
4. `Platform/SubscriptionPaymentVerification.tsx` - Payment verification UI (~1.5 hours)

**Additional Tasks:**
1. Trial expiry cron job (~1 hour)
2. Email notifications (~1 hour)
3. Testing & integration (~2 hours)

---

**Status:** Backend Complete, Frontend Pending  
**Progress:** 50% Complete (Backend Done)  
**Estimated Remaining:** 6-8 hours (Frontend + Testing)  
**Target Release:** December 27-28, 2024
