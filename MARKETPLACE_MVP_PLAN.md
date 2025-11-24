# 🏪 Marketplace MVP Plan — Sprint 2

> **Goal**: Launch a lean but impactful marketplace for plugins/integrations with vendor onboarding, Stripe Checkout, and customer discovery.

**Sprint**: Sprint 2 (Week 2)  
**Timeline**: 5 days (Dec 2-6, 2025)  
**Team Size**: 2-3 developers (1 frontend, 1 backend, 0.5 DevOps)

---

## 🎯 Sprint 2 Objectives

1. **Marketplace UI**: Browse listings, search/filter, detail pages
2. **Vendor Portal**: Upload and manage listings (CRUD)
3. **Payment Flow**: Stripe Checkout integration with vendor payouts
4. **Documentation**: Architecture, vendor onboarding, component patterns
5. **Deployment**: Staging verification, CI/CD pipeline extension

---

## 📋 Backlog Items (Organized by Track)

### 🔎 Frontend (React/Next.js) — 5 items, ~3 days

#### 1. **Marketplace UI Shell** `frontend` `marketplace` `routing`

-   **Description**: Create `/marketplace` route with layout (sidebar, search, filters)
-   **Tasks**:
    -   Create `src/app/marketplace/page.tsx` (App Router)
    -   Add `MarketplaceLayout` component with sidebar navigation
    -   Implement search bar with debounced input
    -   Add filter panel (category, price range, vendor)
    -   Responsive design (mobile, tablet, desktop)
-   **Acceptance Criteria**:
    -   Route accessible at `/marketplace`
    -   Search bar filters listings by title/description
    -   Filters update URL query params (e.g., `?category=analytics&maxPrice=50`)
    -   Mobile: Sidebar collapses to hamburger menu
-   **Owner**: _Frontend Lead_
-   **Estimate**: 1 day
-   **Dependencies**: None
-   **Files**:
    -   `frontend/src/app/marketplace/page.tsx`
    -   `frontend/src/app/marketplace/layout.tsx`
    -   `frontend/src/components/marketplace/SearchBar.tsx`
    -   `frontend/src/components/marketplace/FilterPanel.tsx`

#### 2. **Listing Card Component** `frontend` `marketplace` `component`

-   **Description**: Reusable card for plugins/integrations (title, description, price, vendor)
-   **Tasks**:
    -   Create `ListingCard.tsx` component
    -   Display: thumbnail, title, vendor name, price, rating, category badge
    -   Add hover effects (shadow, scale transform)
    -   Click navigates to `/marketplace/[listingId]` detail page
    -   TypeScript props: `Listing` interface
-   **Acceptance Criteria**:
    -   Card displays all required fields
    -   Hover state provides visual feedback
    -   Clicking card navigates to detail page
    -   Component is reusable across marketplace and vendor dashboard
-   **Owner**: _Frontend Dev_
-   **Estimate**: 0.5 day
-   **Dependencies**: TypeScript Models (#10)
-   **Files**:
    -   `frontend/src/components/marketplace/ListingCard.tsx`
    -   `frontend/src/components/marketplace/ListingCard.module.css`

#### 3. **Vendor Dashboard** `frontend` `marketplace` `vendor`

-   **Description**: Simple page for vendors to upload/manage listings
-   **Tasks**:
    -   Create `src/app/marketplace/vendor/page.tsx` (App Router)
    -   Add `VendorDashboard` component with tabs (My Listings, Analytics, Settings)
    -   Implement listing upload form (title, description, price, category, thumbnail)
    -   Add edit/delete actions for existing listings
    -   Display vendor revenue chart (Nivo Bar chart)
-   **Acceptance Criteria**:
    -   Route accessible at `/marketplace/vendor` (vendor role required)
    -   Upload form validates all required fields (Formik + Zod)
    -   Edit/delete actions trigger API calls and update UI
    -   Revenue chart displays last 30 days of sales
-   **Owner**: _Frontend Dev_
-   **Estimate**: 1.5 days
-   **Dependencies**: Vendor Auth (#12), Listings API (#11)
-   **Files**:
    -   `frontend/src/app/marketplace/vendor/page.tsx`
    -   `frontend/src/components/marketplace/VendorDashboard.tsx`
    -   `frontend/src/components/marketplace/ListingUploadForm.tsx`
    -   `frontend/src/components/marketplace/VendorRevenueChart.tsx`

#### 4. **Checkout Flow** `frontend` `marketplace` `payments`

-   **Description**: Integrate Stripe Checkout for purchases
-   **Tasks**:
    -   Add "Buy Now" button to listing detail page
    -   Call backend API to create Stripe Checkout session
    -   Redirect to Stripe-hosted checkout page
    -   Handle success/cancel redirects (`/marketplace/success`, `/marketplace/cancel`)
    -   Display purchase confirmation with download link (if applicable)
-   **Acceptance Criteria**:
    -   Clicking "Buy Now" creates Stripe session and redirects
    -   Success page displays order confirmation and receipt
    -   Cancel page allows user to return to listing
    -   Purchase triggers notification (email + in-app via `useNotifications`)
-   **Owner**: _Frontend Dev_
-   **Estimate**: 0.5 day
-   **Dependencies**: Stripe Connect Integration (#11)
-   **Files**:
    -   `frontend/src/app/marketplace/[listingId]/page.tsx` (detail page)
    -   `frontend/src/app/marketplace/success/page.tsx`
    -   `frontend/src/app/marketplace/cancel/page.tsx`
    -   `frontend/src/lib/stripe.ts` (Stripe client)

#### 5. **Notifications Integration** `frontend` `marketplace` `notifications`

-   **Description**: Use existing `useNotifications` hook for purchase confirmations
-   **Tasks**:
    -   Add marketplace-specific notification types (`marketplace.purchase`, `marketplace.listing_approved`)
    -   Update `backend/src/services/notificationService.ts` with marketplace events
    -   Emit Socket.IO events on purchase completion
    -   Display toast notifications in frontend (`react-toastify`)
-   **Acceptance Criteria**:
    -   Customer receives notification on successful purchase
    -   Vendor receives notification when listing is purchased
    -   Notifications appear in notification center (`NotificationBell.tsx`)
    -   Socket.IO events emitted to correct user rooms
-   **Owner**: _Frontend Dev_
-   **Estimate**: 0.25 day
-   **Dependencies**: Listings API (#11)
-   **Files**:
    -   `backend/src/services/notificationService.ts` (update)
    -   `frontend/src/hooks/useNotifications.ts` (already exists)

---

### 📚 Documentation — 3 items, ~0.5 days

#### 6. **Create MARKETPLACE_README.md** `docs` `marketplace` `architecture`

-   **Description**: Architecture, payment flow, vendor onboarding guide
-   **Tasks**:
    -   Document marketplace architecture (frontend routes, backend API, Stripe flow)
    -   Add vendor onboarding steps (signup, verification, first listing)
    -   Include payment flow diagram (customer → Stripe → vendor payout)
    -   Add API reference for marketplace endpoints
    -   Security considerations (vendor verification, fraud prevention)
-   **Acceptance Criteria**:
    -   README covers all marketplace features
    -   Includes Mermaid diagrams for architecture and payment flow
    -   Vendor onboarding checklist with 10+ steps
    -   API reference table (endpoint, method, auth, params, response)
-   **Owner**: _DevOps Team / Frontend Lead_
-   **Estimate**: 0.25 day
-   **Dependencies**: None
-   **Files**:
    -   `MARKETPLACE_README.md`

#### 7. **Update ROADMAP_README.md** `docs` `roadmap` `marketplace`

-   **Description**: Include marketplace milestones in roadmap
-   **Tasks**:
    -   Add "Marketplace MVP" epic to ROADMAP_CONSOLIDATED.md
    -   Update ROADMAP_QUICK_REF.md with Sprint 2 marketplace focus
    -   Add marketplace to EXECUTION_PLAN.md (Day 1-5 breakdown)
    -   Update SPRINT_BOARD.md with Marketplace MVP backlog
-   **Acceptance Criteria**:
    -   Marketplace epic appears in roadmap with milestones
    -   Sprint 2 execution plan includes marketplace tasks
    -   Sprint board reflects Marketplace MVP backlog items
-   **Owner**: _Scrum Master / DevOps Team_
-   **Estimate**: 0.15 day
-   **Dependencies**: None
-   **Files**:
    -   `ROADMAP_CONSOLIDATED.md` (update)
    -   `ROADMAP_QUICK_REF.md` (update)
    -   `EXECUTION_PLAN.md` (update)
    -   `SPRINT_BOARD.md` (update)

#### 8. **Extend REACT_BEST_PRACTICES.md** `docs` `frontend` `patterns`

-   **Description**: Marketplace component patterns (smart vs presentational)
-   **Tasks**:
    -   Add "Marketplace Component Patterns" section
    -   Document smart components (`MarketplacePage`, `VendorDashboard`)
    -   Document presentational components (`ListingCard`, `FilterPanel`)
    -   Add custom hooks section (`useMarketplaceListings`, `useCheckout`)
    -   Include TypeScript interface examples (`Listing`, `Vendor`, `Transaction`)
-   **Acceptance Criteria**:
    -   New section added to REACT_BEST_PRACTICES.md
    -   Includes code examples for smart/presentational split
    -   Custom hooks documented with usage patterns
    -   TypeScript interfaces defined with JSDoc comments
-   **Owner**: _Frontend Lead_
-   **Estimate**: 0.1 day
-   **Dependencies**: None
-   **Files**:
    -   `REACT_BEST_PRACTICES.md` (update)

---

### 🧩 Patterns & Architecture — 4 items, ~1.5 days

#### 9. **MarketplaceContext Provider** `frontend` `state` `context`

-   **Description**: Context for listings, cart, and vendor state
-   **Tasks**:
    -   Create `MarketplaceContext` with `createContext`
    -   State: `listings`, `cart`, `selectedVendor`, `filters`
    -   Actions: `addToCart`, `removeFromCart`, `applyFilters`, `fetchListings`
    -   Provider wraps marketplace routes in `layout.tsx`
    -   Export `useMarketplace` hook for consuming context
-   **Acceptance Criteria**:
    -   Context provides all marketplace state and actions
    -   Components can consume context via `useMarketplace()`
    -   State updates trigger re-renders in consuming components
    -   Context is scoped to marketplace routes only (not global)
-   **Owner**: _Frontend Lead_
-   **Estimate**: 0.5 day
-   **Dependencies**: None
-   **Files**:
    -   `frontend/src/contexts/MarketplaceContext.tsx`
    -   `frontend/src/app/marketplace/layout.tsx` (wrap with provider)

#### 10. **Custom Hooks** `frontend` `hooks` `marketplace`

-   **Description**: `useMarketplaceListings`, `useVendorDashboard`, `useCheckout`
-   **Tasks**:
    -   **`useMarketplaceListings`**: Fetch listings with pagination, search, filters
    -   **`useVendorDashboard`**: Fetch vendor's listings, revenue, analytics
    -   **`useCheckout`**: Create Stripe session, handle success/cancel
    -   Add TypeScript types for all hook return values
    -   Include error handling and loading states
-   **Acceptance Criteria**:
    -   All 3 hooks implemented with consistent API
    -   Hooks return `{ data, loading, error, refetch }` pattern
    -   TypeScript types exported for hook return values
    -   Hooks handle edge cases (network errors, empty states)
-   **Owner**: _Frontend Dev_
-   **Estimate**: 0.5 day
-   **Dependencies**: Listings API (#11)
-   **Files**:
    -   `frontend/src/hooks/useMarketplaceListings.ts`
    -   `frontend/src/hooks/useVendorDashboard.ts`
    -   `frontend/src/hooks/useCheckout.ts`

#### 11. **Error Boundaries** `frontend` `error-handling` `resilience`

-   **Description**: Wrap marketplace routes with fallback UI
-   **Tasks**:
    -   Create `MarketplaceErrorBoundary` component
    -   Add fallback UI with retry button
    -   Integrate with Sentry for error reporting
    -   Wrap marketplace layout with error boundary
-   **Acceptance Criteria**:
    -   Errors in marketplace routes caught by boundary
    -   Fallback UI displays friendly error message
    -   "Retry" button reloads component tree
    -   Errors logged to Sentry with marketplace context
-   **Owner**: _Frontend Dev_
-   **Estimate**: 0.25 day
-   **Dependencies**: None
-   **Files**:
    -   `frontend/src/components/marketplace/MarketplaceErrorBoundary.tsx`
    -   `frontend/src/app/marketplace/layout.tsx` (wrap with boundary)

#### 12. **TypeScript Models** `frontend` `typescript` `types`

-   **Description**: Define `Listing`, `Vendor`, `Transaction` interfaces
-   **Tasks**:
    -   Create `frontend/src/types/marketplace.ts`
    -   Define interfaces: `Listing`, `Vendor`, `Transaction`, `Category`, `Filter`
    -   Add JSDoc comments for all fields
    -   Export from `frontend/src/types/index.ts`
-   **Acceptance Criteria**:
    -   All marketplace types defined with strict typing
    -   JSDoc comments explain field purpose
    -   Types match backend API responses
    -   No `any` types used
-   **Owner**: _Frontend Lead_
-   **Estimate**: 0.25 day
-   **Dependencies**: None
-   **Files**:
    -   `frontend/src/types/marketplace.ts`
    -   `frontend/src/types/index.ts` (export)

---

### 🚀 Backend & Deployment — 5 items, ~2.5 days

#### 13. **Stripe Connect Integration** `backend` `payments` `stripe`

-   **Description**: Vendor payouts and transaction tracking
-   **Tasks**:
    -   Set up Stripe Connect for multi-party payments
    -   Create Stripe Connect onboarding flow for vendors
    -   Implement payout API (`POST /api/marketplace/payouts`)
    -   Track transactions in `MarketplaceTransaction` Prisma model
    -   Add webhook handler for Stripe Connect events
-   **Acceptance Criteria**:
    -   Vendors can connect Stripe accounts
    -   Purchases split payment (platform fee + vendor payout)
    -   Transactions logged in database with Stripe IDs
    -   Webhook handler processes `account.updated`, `payment_intent.succeeded`
-   **Owner**: _Backend Dev_
-   **Estimate**: 1 day
-   **Dependencies**: Prisma schema update
-   **Files**:
    -   `backend/src/routes/marketplace.ts` (payouts endpoint)
    -   `backend/src/routes/stripeConnect.ts` (onboarding)
    -   `backend/src/services/stripeService.ts` (update)
    -   `backend/prisma/schema.prisma` (add `MarketplaceTransaction` model)

#### 14. **Listings API** `backend` `marketplace` `crud`

-   **Description**: CRUD endpoints for marketplace items
-   **Tasks**:
    -   `GET /api/marketplace/listings` (paginated, filterable)
    -   `GET /api/marketplace/listings/:id` (detail)
    -   `POST /api/marketplace/listings` (vendor creates listing)
    -   `PUT /api/marketplace/listings/:id` (vendor updates listing)
    -   `DELETE /api/marketplace/listings/:id` (vendor deletes listing)
    -   Add Zod validation schemas for all endpoints
    -   Implement authorization (vendors can only edit their own listings)
-   **Acceptance Criteria**:
    -   All CRUD endpoints functional
    -   Pagination works with `?page=1&limit=20`
    -   Filters work with `?category=analytics&minPrice=10`
    -   Authorization prevents cross-vendor edits
    -   Zod schemas validate all inputs
-   **Owner**: _Backend Dev_
-   **Estimate**: 1 day
-   **Dependencies**: Prisma schema update, Zod validation
-   **Files**:
    -   `backend/src/routes/marketplace.ts`
    -   `backend/src/schemas/marketplace.ts` (Zod schemas)
    -   `backend/prisma/schema.prisma` (add `Listing`, `Vendor` models)

#### 15. **Vendor Auth** `backend` `auth` `roles`

-   **Description**: Extend existing auth for vendor role
-   **Tasks**:
    -   Add `vendor` role to `User` model in Prisma schema
    -   Update JWT payload to include vendor role
    -   Create `requireVendor` middleware (similar to `requireAdmin`)
    -   Add vendor signup flow (`POST /api/auth/vendor/signup`)
    -   Implement vendor verification (email + manual approval)
-   **Acceptance Criteria**:
    -   Vendors can sign up with dedicated flow
    -   JWT includes `role: 'vendor'`
    -   `requireVendor` middleware protects vendor routes
    -   Vendor status tracked (`pending`, `approved`, `rejected`)
-   **Owner**: _Backend Dev_
-   **Estimate**: 0.5 day
-   **Dependencies**: Prisma schema update
-   **Files**:
    -   `backend/src/middleware/auth.ts` (add `requireVendor`)
    -   `backend/src/routes/auth.ts` (add vendor signup)
    -   `backend/prisma/schema.prisma` (update `User` model)

#### 16. **CI/CD Update** `devops` `ci-cd` `testing`

-   **Description**: Add marketplace tests to GitHub Actions pipeline
-   **Tasks**:
    -   Add Jest tests for marketplace API endpoints
    -   Add Playwright E2E tests for marketplace UI flow
    -   Update `.github/workflows/docker-build-push.yml` to run marketplace tests
    -   Add test coverage thresholds for marketplace code (80%+)
-   **Acceptance Criteria**:
    -   Unit tests cover all marketplace API endpoints
    -   E2E tests cover: browse → detail → checkout → success
    -   GitHub Actions runs marketplace tests on PR
    -   Coverage report shows 80%+ for marketplace code
-   **Owner**: _DevOps Lead + Backend Dev_
-   **Estimate**: 0.5 day
-   **Dependencies**: Listings API (#14), Checkout Flow (#4)
-   **Files**:
    -   `backend/src/routes/__tests__/marketplace.test.ts`
    -   `frontend/tests/e2e/marketplace.spec.ts`
    -   `.github/workflows/docker-build-push.yml` (update)

#### 17. **Staging Deploy** `devops` `deployment` `staging`

-   **Description**: Verify marketplace UI + API in staging
-   **Tasks**:
    -   Deploy marketplace code to staging environment
    -   Run smoke tests on marketplace endpoints
    -   Verify Stripe Connect works in test mode
    -   Test vendor onboarding flow end-to-end
    -   Monitor Sentry for marketplace errors
-   **Acceptance Criteria**:
    -   Marketplace accessible at `https://staging.advancia.io/marketplace`
    -   All API endpoints return expected responses
    -   Stripe Connect onboarding completes in test mode
    -   No critical errors in Sentry dashboard
-   **Owner**: _DevOps Lead_
-   **Estimate**: 0.5 day
-   **Dependencies**: All other items complete
-   **Files**:
    -   N/A (deployment)

---

## 📊 Sprint 2 Capacity Planning

| Role              | Tasks                     | Total Days |
| ----------------- | ------------------------- | ---------- |
| **Frontend Lead** | #1, #2, #9, #12, #8       | 2.35 days  |
| **Frontend Dev**  | #3, #4, #5, #10, #11      | 3.0 days   |
| **Backend Dev**   | #13, #14, #15, #16 (part) | 3.0 days   |
| **DevOps Lead**   | #6, #7, #16 (part), #17   | 1.4 days   |
| **Scrum Master**  | #7 (part)                 | 0.15 days  |

**Total Effort**: ~7.4 days (distributed across 5-day sprint with 2-3 developers)

**Parallelization**:

-   Frontend and backend can work in parallel (API mocking for frontend)
-   Documentation can be written alongside development
-   Deployment preparation happens in last 2 days

---

## ✅ Sprint 2 Deliverables

### **Functional**

-   ✅ Marketplace MVP live in staging
-   ✅ Vendors can onboard and list items
-   ✅ Customers can browse listings and purchase via Stripe Checkout
-   ✅ Vendor dashboard shows revenue and analytics
-   ✅ Notifications for purchases and listing updates

### **Technical**

-   ✅ Stripe Connect integrated for vendor payouts
-   ✅ CRUD API for marketplace listings
-   ✅ MarketplaceContext for state management
-   ✅ Custom hooks for listings, vendor dashboard, checkout
-   ✅ Error boundaries for marketplace routes
-   ✅ TypeScript models for all marketplace entities

### **Documentation**

-   ✅ `MARKETPLACE_README.md` with architecture and vendor onboarding
-   ✅ Updated roadmap with marketplace milestones
-   ✅ Extended `REACT_BEST_PRACTICES.md` with marketplace patterns

### **Testing & Deployment**

-   ✅ Unit tests for marketplace API (80%+ coverage)
-   ✅ E2E tests for marketplace UI flow
-   ✅ CI/CD pipeline extended with marketplace tests
-   ✅ Staging environment verified and stable

---

## 🔄 Sprint 2 Daily Breakdown

### **Day 1 (Dec 2)**: Foundation

-   **Morning**: TypeScript models (#12), MarketplaceContext (#9)
-   **Afternoon**: Listings API (#14) started, Vendor Auth (#15)
-   **EOD**: Basic marketplace structure in place

### **Day 2 (Dec 3)**: Core Features

-   **Morning**: Marketplace UI Shell (#1), Listing Card Component (#2)
-   **Afternoon**: Listings API (#14) completed, Stripe Connect Integration (#13) started
-   **EOD**: Browse listings functional, backend endpoints working

### **Day 3 (Dec 4)**: Vendor & Payments

-   **Morning**: Vendor Dashboard (#3), Stripe Connect Integration (#13) completed
-   **Afternoon**: Checkout Flow (#4), Custom Hooks (#10)
-   **EOD**: End-to-end purchase flow working

### **Day 4 (Dec 5)**: Polish & Testing

-   **Morning**: Notifications Integration (#5), Error Boundaries (#11)
-   **Afternoon**: Documentation (#6, #7, #8), CI/CD Update (#16)
-   **EOD**: All features complete, tests passing

### **Day 5 (Dec 6)**: Deployment & Demo

-   **Morning**: Staging Deploy (#17), smoke tests
-   **Afternoon**: Sprint demo, retrospective
-   **EOD**: Marketplace MVP deployed to staging

---

## 🚧 Risks & Mitigations

| Risk                                            | Impact | Mitigation                                                  |
| ----------------------------------------------- | ------ | ----------------------------------------------------------- |
| **Stripe Connect complexity**                   | High   | Start early (Day 1), use Stripe docs, test mode first       |
| **Frontend/backend integration delays**         | Medium | API mocking, contract testing, daily standups               |
| **Vendor verification manual step**             | Low    | Auto-approve in staging, document manual process            |
| **Performance issues with listings pagination** | Medium | Implement cursor-based pagination, add indexes              |
| **Scope creep**                                 | High   | Stick to MVP, defer features to Sprint 3 (ratings, reviews) |

---

## 🎯 Success Metrics

**User Metrics**:

-   5+ vendors onboarded in staging
-   20+ listings created
-   10+ test purchases completed
-   0 critical bugs in Sentry

**Technical Metrics**:

-   API response time: <200ms (95th percentile)
-   Marketplace page load: <2 seconds
-   Test coverage: 80%+ for marketplace code
-   Zero deployment failures

**Business Metrics**:

-   Vendor onboarding time: <10 minutes
-   Checkout conversion rate: >70% (test users)
-   Average listing creation time: <5 minutes

---

## 📌 Sprint 3 Teasers (Deferred Features)

-   **Ratings & Reviews**: Customer feedback on listings
-   **Search Autocomplete**: Typeahead suggestions for listings
-   **Vendor Analytics Dashboard**: Advanced revenue charts, customer insights
-   **Listing Categories Management**: Admin panel for category CRUD
-   **Wishlist/Favorites**: Save listings for later
-   **Bulk Listing Upload**: CSV import for vendors with many items
-   **Referral Program**: Vendors earn commission on referrals

---

## 🔗 Related Documents

-   **SPRINT_BOARD.md**: Current sprint status and backlog
-   **REACT_BEST_PRACTICES.md**: Frontend coding standards
-   **ROADMAP_CONSOLIDATED.md**: 6-month strategic vision
-   **EXECUTION_PLAN.md**: Day-by-day tactical breakdown
-   **CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md**: Infrastructure setup

---

**Last Updated**: November 24, 2025  
**Maintainer**: DevOps Team + Frontend Lead  
**Sprint**: Sprint 2 (Week 2)  
**Status**: Planning (ready for Sprint 1 completion)
