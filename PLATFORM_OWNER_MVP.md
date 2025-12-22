# Platform Owner - MVP Specification

## 🎯 Goal
Provide **minimal but functional** platform owner interface to manage tenants and subscriptions. Focus is on **Tenant Admin features** for water management.

---

## ✅ What's Already Done (Backend)

### API Endpoints Ready:
```
GET  /api/platform/tenants                    # List all tenants
GET  /api/platform/tenants/:id                # Tenant detail
PUT  /api/platform/tenants/:id                # Update tenant
POST /api/platform/tenants/:id/suspend        # Suspend tenant
POST /api/platform/tenants/:id/activate       # Activate tenant
GET  /api/platform/tenants/:id/statistics     # Tenant stats
GET  /api/platform/analytics/overview         # Platform overview
GET  /api/platform/subscription-plans         # List plans
```

### Data Available:
- Tenant list with subscription info
- Subscription status & expiry dates
- Customer count per tenant (for pricing)
- Storage usage
- Basic platform metrics (MRR, tenant count)

### Role-Based Access:
- Backend: ✅ Middleware checks role
- Frontend: ✅ Sidebar menu filtering

---

## 📱 MVP Frontend - To Build

### 1. Simple Tenant List Page
**Route:** `/admin/platform/tenants`

**Must Have:**
- Table showing tenants with:
  - Name, email, village code
  - Subscription plan & status
  - Expiry date
  - Customer count
  - Action buttons (View, Edit, Suspend)
- Search by name/email
- Status filter (All, Active, Trial, Suspended)

**Nice to Have (Later):**
- ❌ Pagination (use simple scrolling for now)
- ❌ Sorting (default by created date)
- ❌ Export to Excel (later)

**Estimated Time:** 4 hours

---

### 2. Tenant Detail Page (View Only)
**Route:** `/admin/platform/tenants/:id`

**Must Have:**
- Tenant information:
  - Name, contact, address
  - Subscription plan & status
  - Start date & expiry date
  - Customer count, user count
  - Storage usage
- Simple statistics:
  - Total customers
  - Total users
  - Storage used vs limit
- Action buttons:
  - Edit button
  - Suspend/Activate button

**Nice to Have (Later):**
- ❌ Charts (later)
- ❌ Activity history (later)
- ❌ Billing history (later)

**Estimated Time:** 3 hours

---

### 3. Simple Platform Dashboard
**Route:** `/admin` (when role = PLATFORM_OWNER)

**Must Have:**
- Cards showing:
  - Total tenants
  - Active tenants
  - Trial tenants
  - Suspended tenants
  - Monthly Recurring Revenue (MRR)
- Simple list:
  - Recent tenant signups
  - Expiring subscriptions (next 30 days)

**Nice to Have (Later):**
- ❌ Charts & graphs (later)
- ❌ Detailed analytics (later)
- ❌ Growth trends (later)

**Estimated Time:** 3 hours

---

### 4. Edit Tenant Modal (Simple)
**Component:** Modal/Dialog

**Must Have:**
- Form fields:
  - Name
  - Email
  - Phone
  - Address
  - Notes
- Save button
- Cancel button

**Nice to Have (Later):**
- ❌ Change subscription plan (later)
- ❌ Change limits (later)

**Estimated Time:** 2 hours

---

## 🚫 Features NOT in MVP

### ❌ Not Building Now:
1. Subscription Plan Management UI
   - Use backend seeder/SQL for now
2. Detailed Analytics Dashboard
   - Charts, graphs, trends
3. Tenant Billing & Invoicing
   - Manual for now
4. Tenant Onboarding Wizard
   - Create manually for now
5. Usage-Based Pricing Calculator
   - Fixed pricing for now
6. Tenant Performance Benchmarking
   - Not needed yet
7. White-Label Customization
   - Not needed yet

### Why Not?
- These are nice-to-have features
- Core water management needs attention
- Can be added later when proven valuable
- Manual processes work fine for MVP

---

## 📋 Implementation Checklist

### Phase 1: Basic Pages (Total: ~12 hours)
- [ ] Create `/pages/platform/TenantList.tsx` (4h)
- [ ] Create `/pages/platform/TenantDetail.tsx` (3h)
- [ ] Create `/pages/platform/PlatformDashboard.tsx` (3h)
- [ ] Create `/components/platform/EditTenantModal.tsx` (2h)

### Phase 2: Integration (Total: ~4 hours)
- [ ] Connect TenantList to API (1h)
- [ ] Connect TenantDetail to API (1h)
- [ ] Connect PlatformDashboard to API (1h)
- [ ] Test all endpoints (1h)

### Phase 3: Polish (Total: ~4 hours)
- [ ] Add loading states (1h)
- [ ] Add error handling (1h)
- [ ] Add success/error toasts (1h)
- [ ] Test user flow (1h)

**Total Time: ~20 hours = 2-3 days**

---

## 🎨 UI Guidelines (Keep Simple)

### Design Principles:
✅ **Functional over fancy** - Plain tables, simple cards
✅ **Clear information** - Easy to scan
✅ **Minimal clicks** - Direct actions
✅ **Consistent** - Use existing components

### Don't:
❌ Don't create custom components
❌ Don't add animations
❌ Don't over-design
❌ Don't add unnecessary features

### Use Existing:
✅ Tailwind CSS classes
✅ Heroicons
✅ Existing Button/Input components
✅ Existing Modal component

---

## 🔧 Technical Notes

### State Management
- Use `useState` for local state
- Use `useEffect` for data fetching
- No Redux needed for MVP

### API Integration
```typescript
// Example API call
import { apiClient } from '../services/apiClient';

const fetchTenants = async () => {
  try {
    const response = await apiClient.get('/api/platform/tenants');
    setTenants(response.data);
  } catch (error) {
    console.error('Error fetching tenants:', error);
  }
};
```

### Routes to Add
```typescript
// In App.tsx or routes config
{
  path: '/admin/platform',
  element: <DashboardLayout />,
  children: [
    { path: 'tenants', element: <TenantList /> },
    { path: 'tenants/:id', element: <TenantDetail /> },
  ]
}
```

### Menu Already Done
✅ Sidebar filtering works
✅ Platform Owner sees different menu
✅ Role-based navigation ready

---

## 📊 Data Flow

```
User Login (PLATFORM_OWNER)
    ↓
Sidebar shows Platform Owner menu
    ↓
Navigate to /admin → Platform Dashboard
    ↓
Dashboard shows: tenant count, MRR, recent signups
    ↓
Click "View Tenants" → Tenant List Page
    ↓
Table shows all tenants with subscription info
    ↓
Click tenant → Tenant Detail Page
    ↓
Shows full tenant info, stats, actions
    ↓
Click Edit → Edit Modal
    ↓
Save changes → Update API → Refresh
```

---

## 🧪 Testing Checklist

### Manual Testing:
- [ ] Login as PLATFORM_OWNER
- [ ] Check sidebar menu (only platform items)
- [ ] Open dashboard (see tenant count, MRR)
- [ ] Open tenant list (see all tenants)
- [ ] Search tenants (works)
- [ ] Filter by status (works)
- [ ] Click view tenant (opens detail)
- [ ] Click edit tenant (opens modal)
- [ ] Save changes (updates)
- [ ] Click suspend (confirms & suspends)
- [ ] Click activate (activates)

### Edge Cases:
- [ ] No tenants (empty state)
- [ ] API error (error message)
- [ ] Loading state (skeleton/spinner)
- [ ] Invalid tenant ID (404 page)

---

## 📦 Deliverables

### Files to Create:
```
tirta-saas-frontend/src/
├── pages/
│   └── platform/
│       ├── TenantList.tsx
│       ├── TenantDetail.tsx
│       └── PlatformDashboard.tsx
└── components/
    └── platform/
        └── EditTenantModal.tsx
```

### Files to Update:
```
✅ src/components/Sidebar.tsx (DONE)
✅ src/services/authService.ts (DONE)
- src/App.tsx (add routes)
```

---

## 🚀 Deployment

### Development:
```bash
# Frontend
cd tirta-saas-frontend
npm run dev

# Backend already ready
cd tirta-saas-backend
./tirta-backend
```

### Testing Platform Owner:
1. Create PLATFORM_OWNER user in database:
```sql
INSERT INTO users (id, name, email, password, role, tenant_id)
VALUES (
  uuid(),
  'Platform Owner',
  'owner@tirta-saas.com',
  '$2a$10$hashedpassword', -- Use bcrypt
  'PLATFORM_OWNER',
  NULL
);
```

2. Login with platform owner credentials
3. Verify menu shows platform items only
4. Test all platform owner pages

---

## 📝 Documentation

### For Users:
- [ ] Platform Owner User Guide (simple PDF)
- [ ] How to manage tenants
- [ ] How to suspend/activate
- [ ] How to read dashboard

### For Developers:
✅ PLATFORM_OWNER_SCOPE.md (DONE)
✅ ROADMAP.md (DONE)
- [ ] API documentation (Swagger)

---

## 💡 Future Enhancements (Post-MVP)

### Phase 2 (Q3 2025):
- Advanced analytics dashboard
- Charts & graphs
- Subscription plan management UI
- Tenant billing & invoicing
- Tenant onboarding wizard

### Phase 3 (Q4 2025):
- Usage-based pricing
- Tenant performance benchmarking
- White-label customization
- Multi-language support

---

## ✅ Success Criteria

### MVP is Done When:
✅ Platform Owner can login
✅ See list of all tenants
✅ View tenant details
✅ Edit tenant info
✅ Suspend/activate tenant
✅ See basic dashboard metrics
✅ All actions work without errors

### MVP is NOT Required:
❌ Beautiful charts
❌ Complex analytics
❌ Advanced features
❌ Perfect UI/UX

**Principle:** Make it work, then make it pretty.

---

## 🎯 Next Steps

1. **Complete partial TenantList.tsx** (already started)
2. Build TenantDetail.tsx
3. Build PlatformDashboard.tsx
4. Build EditTenantModal.tsx
5. Connect to APIs
6. Test thoroughly
7. Document for users

**Focus:** Get it working in 2-3 days, then move back to **Tenant Admin** features!

---

**Document Version:** 1.0
**Last Updated:** 2024-12-22
**Status:** 🟢 Ready to Build
**Priority:** 🟡 Medium (20% time allocation)
