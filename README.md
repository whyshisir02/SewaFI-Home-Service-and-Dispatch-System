# SewaFi - Home Services Dispatch Platform

SewaFi is a full-stack marketplace for Nepal that connects customers with verified home-service providers.  
The platform covers the complete operational lifecycle: booking, area-aware dispatch, provider job execution, final amount confirmation, payout settlement, reviews, in-app notifications, and opt-in browser push notifications.

This README reflects the current implementation in this repository.

## 1) What SewaFi Solves

SewaFi manages real service operations, not only listing and discovery:

- Customers submit service requests with address snapshots and preferred time windows.
- Providers receive nearby jobs based on category, service area, approval status, and availability.
- Dispatch escalates in waves and auto-expires stale pending jobs.
- Providers move accepted work to in-progress and submit final amount.
- Customers confirm or dispute payment before completion.
- Admin tracks revenue/commission, provider payouts, support messages, and operations.
- Customers can review providers after completed paid bookings.

## 2) System Architecture

```mermaid
flowchart LR
  A[React + Vite Frontend] -->|REST + Cookies/JWT| B[Express API]
  A -->|Socket.IO Client| C[Socket.IO Server]
  A -->|Service Worker + PushManager| J[Browser Push]
  B --> D[(PostgreSQL via Prisma)]
  B --> E[(Redis)]
  E --> F[BullMQ Dispatch Queue]
  F --> G[Dispatch Worker]
  G --> B
  B --> H[Resend Email]
  B --> I[Cloudinary]
  B -->|web-push VAPID| J
  C --> A
```

### Backend

- Node.js + Express 5
- Prisma + PostgreSQL
- JWT auth (access + refresh) with role-based authorization
- Redis for queue, caching, OTP support, and rate-limit store
- BullMQ dispatch jobs and worker
- Socket.IO for live booking and notification updates
- Web Push delivery (`web-push`) for selected high-priority events

### Frontend

- React 19 + Vite
- React Router 7
- TanStack Query
- Tailwind CSS
- Axios (`withCredentials` + bearer support)
- Service Worker for browser notifications

## 3) Core Domain Model

Primary Prisma models:

- `User`
- `ProviderProfile`, `ProviderArea`, `ProviderService`, `ProviderSubCategory`
- `ServiceCategory`, `SubCategory`, `Service`
- `CustomerAddress`
- `Booking`, `BookingStatusHistory`, `ProviderBookingNotification`
- `Payment`
- `Review`
- `Notification`
- `PushSubscription`
- `FAQ`
- `SupportMessage`
- `NepalLocation`

Key enums:

- `BookingStatus`: `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`
- `ProviderStatus`: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `PaymentStatus`: `PENDING`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `PAID`, `DISPUTED`, `CANCELLED`, `REFUNDED`, `CANCELLATION_FEE`
- `PayoutStatus`: `PENDING`, `SETTLED`, `HOLD`, `CANCELLED`
- `DispatchState`: `QUEUED`, `SEARCHING`, `NOTIFIED`, `MATCHED`, `EXPIRED`, `DIRECT`

## 4) End-to-End Workflow

### 4.1 Booking + Dispatch

1. Customer creates `PENDING` booking with:
   - service
   - address snapshot
   - schedule window (`scheduledTime`, optional `scheduledEndTime`)
2. API enqueues BullMQ jobs:
   - `dispatch.booking.created`
   - `dispatch.booking.expire` (delayed)
3. First-wave providers are notified (closest area match first).
4. If unaccepted, second-wave escalation runs.
5. If window expires before acceptance, booking is system-cancelled:
   - `status = CANCELLED`
   - `cancelledBy = SYSTEM`
   - `dispatchState = EXPIRED`

### 4.2 Provider Lifecycle

1. Nearby job visibility checks:
   - approved provider profile
   - active account
   - availability and service area match
2. Accept booking:
   - `providerId` assigned
   - `status = ACCEPTED`
   - provider busy flag set
3. Start work:
   - `status = IN_PROGRESS`
4. Submit final amount:
   - `paymentStatus = AWAITING_CONFIRMATION`
   - customer must confirm or dispute

### 4.3 Payment + Settlement

1. Customer confirms payment:
   - `paymentStatus = PAID`
   - `booking.status = COMPLETED`
   - `payoutStatus = PENDING`
2. Commission is computed server-side (`PLATFORM_COMMISSION_PERCENT`, default 10%).
3. Admin settles eligible payouts:
   - only `PAID + COMPLETED` rows
   - `payoutStatus = SETTLED`

### 4.4 Reviews

- Review allowed only for own completed paid booking.
- One review per booking.
- Provider aggregate review/rating metrics are updated after review submission.

### 4.5 Notifications + Push

1. Notification record is saved in `Notification` table.
2. Socket emits live in-app event.
3. Push is best-effort for eligible events when user has active subscription.
4. Push failures never fail business operations.
5. Archived notifications are hidden from active/unread views.

## 5) Privacy and Ownership Rules

- Nearby jobs are privacy-safe: no exact customer address/contact/GPS before accept.
- Assigned provider gets precise location/contact only after acceptance.
- Customer/provider/admin resources are ownership-scoped.
- Admin-only actions are protected with backend role guards.

## 6) Dispatch Reliability

Queue: `dispatch`

Jobs:

- `dispatch.booking.created`
- `dispatch.booking.escalate`
- `dispatch.booking.expire`

Principles:

- PostgreSQL is source of truth.
- Worker logic is idempotent and state-checked.
- Queue failures do not break booking creation response.
- Sensitive details are not broadcast in dispatch previews.

## 7) Redis Caching + Rate Limiting

Safe cached public keys include:

- `services:categories`
- `services:category:<slug>`
- `services:subcategories`
- `locations:provinces`
- `locations:districts:<province>`
- `locations:municipalities:<province>:<district>`
- `public:faqs`

Sensitive transactional data is intentionally not cached.

Rate limiting:

- Global API limiter
- Auth limiter
- OTP/auth-action limits
- Booking/review action limits

## 8) Notification Lifecycle (Phase 5A-5C)

Implemented:

- Tabs: `active`, `unread`, `archived`
- Unread count excludes archived notifications
- Archive actions:
  - archive single
  - unarchive single
  - archive all read
- Daily cleanup:
  - archive old read notifications
  - archive expired notifications
  - delete old archived low/normal-priority rows safely

Push policy (selected events only):

- Provider: nearby job, paid completion, dispute updates
- Customer: accepted, started, awaiting confirmation, completed/review request
- Admin: new provider application, new support message, payment dispute

Push is not sent for low-priority, archived, or expired notifications.

## 9) API Surface (High-Level)

Base:

- Health: `/health`
- API base: `/api/v1`

Main route groups:

- `/auth`
- `/users`
- `/customer`
- `/provider` and `/providers`
- `/services`
- `/subcategories`
- `/bookings`
- `/payments`
- `/reviews`
- `/notifications`
- `/notifications/push/*`
- `/admin`
- `/admin/faqs`
- `/admin/support/*`
- `/public`
- `/public/contact`
- `/locations`
- `/dashboard`

References:

- `docs/backend-api-overview.md`
- `SewaFi.postman_collection.json`

## 10) Frontend Route Layout

Public:

- `/`
- `/services`, `/services/:id`, `/services/category/:slug`
- `/about`, `/contact`, `/how-it-works`, `/become-provider`

Customer:

- `/customer/dashboard`
- `/customer/book`, `/customer/book/:serviceId`
- `/customer/bookings`, `/customer/bookings/:id`
- `/customer/payments`, `/customer/payments/:bookingId`
- `/customer/addresses`, `/customer/reviews`, `/customer/notifications`

Provider:

- `/provider/dashboard`
- `/provider/nearby-jobs`
- `/provider/assigned-jobs`, `/provider/assigned-jobs/:id`
- `/provider/schedule`, `/provider/availability`
- `/provider/earnings`, `/provider/reviews`, `/provider/notifications`

Admin:

- `/admin/dashboard`
- `/admin/users`, `/admin/providers`, `/admin/bookings`
- `/admin/services`, `/admin/categories`
- `/admin/payments`, `/admin/reviews`
- `/admin/support`
- `/admin/settings`, `/admin/reports`, `/admin/audit-logs`, `/admin/notifications`

## 11) Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Cloudinary account
- Resend API key

### 11.1 Clone

```bash
git clone <repository-url>
cd "Sewafi-Home Services"
```

### 11.2 Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DB

JWT_ACCESS_SECRET=replace-with-32-char-min
JWT_REFRESH_SECRET=replace-with-32-char-min
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379
DISPATCH_ESCALATION_MS=120000
START_DISPATCH_WORKER_IN_API=true

RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_NAME=SewaFi
EMAIL_FROM_ADDRESS=onboarding@resend.dev

CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

PLATFORM_COMMISSION_PERCENT=10

WEB_PUSH_PUBLIC_KEY=your-vapid-public-key
WEB_PUSH_PRIVATE_KEY=your-vapid-private-key
WEB_PUSH_SUBJECT=mailto:your-email@example.com
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Prisma and seeds:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run db:seed:locations
```

Run backend API:

```bash
npm run dev
```

Run dispatch worker separately (recommended):

```bash
npm run worker:dispatch
```

### 11.3 Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
# Optional:
# VITE_SOCKET_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Notes:

- Service worker is at `frontend/public/sw.js`.
- Browser push requires secure context (HTTPS) in production.

## 12) Operational Commands

Backend:

- `npm run dev`
- `npm start`
- `npm run worker:dispatch`
- `npm run db:migrate`
- `npm run db:deploy`
- `npm run db:generate`
- `npm run db:seed`
- `npm run db:seed:locations`

Frontend:

- `npm run dev`
- `npm run build`
- `npm run preview`

## 13) Demo Seed Accounts

If unchanged from seed script:

- Admin: `admin@sewafi.com` / `Password@123`
- Customer: `customer@sewafi.com` / `Password@123`
- Provider: `provider@sewafi.com` / `Password@123`

Change these credentials before any public deployment.

## 14) Security and Error Handling

- Auth guards: `authenticate`, role checks, provider approval checks
- Inactive account restrictions enforced on backend
- Global error middleware sanitizes internal/Prisma errors
- Safe frontend error helper usage for user-facing messages
- CORS restricted to configured origins
- Push delivery is best-effort and cannot break core booking/payment flows

## 15) Current Product Constraints

- Online payment gateway integration is not enabled (manual confirmation flow is active).
- Some compatibility endpoints remain for smooth frontend migration.
- Production data quality for services/categories is managed via admin workflows (not frontend masking).

## 16) Repository Structure

```text
Sewafi-Home Services/
|- backend/
|  |- prisma/
|  |  |- schema.prisma
|  |  |- migrations/
|  |  |- seed.js
|  |  |- seedLocations.js
|  |- src/
|  |  |- config/
|  |  |- middlewares/
|  |  |- modules/
|  |  |- queues/
|  |  |- workers/
|  |  |- services/
|  |  |- utils/
|  |- package.json
|- frontend/
|  |- public/
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- features/
|  |  |- layouts/
|  |  |- router/
|  |  |- lib/
|  |  |- styles/
|  |- package.json
|- docs/
|  |- backend-api-overview.md
|- SewaFi.postman_collection.json
|- README.md
```

## 17) Deployment Checklist

1. Set strong JWT secrets and production CORS origins.
2. Ensure PostgreSQL and Redis are reachable.
3. Run Prisma deploy migrations before startup.
4. Configure Cloudinary and Resend credentials.
5. Configure VAPID keys for push delivery.
6. Run API and dispatch worker as separate processes in production.
7. Verify end-to-end lifecycle: booking -> dispatch -> payment -> settlement -> review.

---

For route-level payloads and examples, use:

- `docs/backend-api-overview.md`
- `SewaFi.postman_collection.json`
