# SewaFi - Home Services Dispatch Platform

SewaFi is a full-stack marketplace that connects customers with verified home-service providers across Nepal. It includes role-based dashboards, area-aware dispatch, provider job lifecycle management, manual payment confirmation, provider payout settlement, and post-completion reviews.

This README reflects the current implemented system in this repository.

## 1) What SewaFi Solves

SewaFi manages the full operational workflow for local home services:

- Customers create bookings with address snapshots and preferred time windows.
- Providers receive nearby jobs based on service category, approval status, availability, and working areas.
- Dispatch escalates in waves and auto-expires stale pending bookings.
- Providers progress jobs from accepted to in-progress, then submit final amount.
- Customers confirm or dispute final payment.
- Admin tracks commission, payout settlement, and platform analytics.
- Customers submit one review per completed paid booking.

## 2) System Architecture

```mermaid
flowchart LR
  A[React + Vite Frontend] -->|REST + Cookies/JWT| B[Express API]
  A -->|Socket.IO client| C[Socket.IO Server]
  B --> D[(PostgreSQL via Prisma)]
  B --> E[(Redis)]
  E --> F[BullMQ Dispatch Queue]
  F --> G[Dispatch Worker]
  G --> B
  B --> H[Resend Email]
  B --> I[Cloudinary]
  C --> A
```

### Backend

- Node.js + Express 5
- Prisma ORM + PostgreSQL
- JWT auth (access + refresh), cookies + bearer support
- Redis for OTP, caching, and rate-limit store fallback
- BullMQ worker for reliable dispatch/escalation/expiry jobs
- Socket.IO for live notifications and booking updates

### Frontend

- React 19 + Vite
- React Router 7
- TanStack Query for server state and invalidation
- Tailwind CSS
- Axios API client (`withCredentials` + bearer token)

## 3) Core Domain Model

Main Prisma models:

- `User` (`CUSTOMER`, `PROVIDER`, `ADMIN`)
- `ProviderProfile`, `ProviderArea`, `ProviderService`, `ProviderSubCategory`
- `ServiceCategory`, `SubCategory`, `Service`
- `CustomerAddress`
- `Booking`, `BookingStatusHistory`, `ProviderBookingNotification`
- `Payment`
- `Review`
- `Notification`
- `FAQ`
- `NepalLocation`

Key enums:

- `BookingStatus`: `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`
- `ProviderStatus`: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `PaymentStatus`: `PENDING`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `PAID`, `DISPUTED`, `CANCELLED`, `REFUNDED`, `CANCELLATION_FEE`
- `PayoutStatus`: `PENDING`, `SETTLED`, `HOLD`, `CANCELLED`
- `DispatchState`: `QUEUED`, `SEARCHING`, `NOTIFIED`, `MATCHED`, `EXPIRED`, `DIRECT`

## 4) End-to-End Workflow

### 4.1 Booking + Dispatch

1. Customer creates booking (`PENDING`) with:
   - service
   - address snapshot (province/district/municipality/street/landmark/coords)
   - schedule window (`scheduledTime`, optional `scheduledEndTime`)
2. API enqueues BullMQ dispatch jobs:
   - `dispatch.booking.created`
   - delayed `dispatch.booking.expire`
3. Worker notifies first-wave providers (exact municipality matches first).
4. If not accepted, worker enqueues/escalates to second-wave providers (district-wide coverage).
5. If schedule window passes without acceptance, booking auto-cancels by system:
   - `status = CANCELLED`
   - `cancelledBy = SYSTEM`
   - `dispatchState = EXPIRED`

### 4.2 Provider Job Flow

1. Provider sees nearby jobs only if:
   - active account
   - approved profile
   - available today
   - category + area match
   - not already declined
2. Provider accepts booking:
   - `providerId` set
   - `status = ACCEPTED`
   - provider busy flag set
3. Provider starts work:
   - `status = IN_PROGRESS`
4. Provider submits final amount (no direct completion):
   - payment/booking moves to `AWAITING_CONFIRMATION`
   - customer must confirm or dispute

### 4.3 Payment + Settlement

1. Customer confirms payment:
   - `paymentStatus = PAID`
   - `booking.status = COMPLETED`
   - payout initially `PENDING`
   - provider busy flag released
2. Commission is backend-calculated:
   - default platform fee percent from env (`PLATFORM_COMMISSION_PERCENT`, default 10%)
3. Admin marks eligible payouts as settled:
   - only paid + completed bookings
   - `payoutStatus = SETTLED`

### 4.4 Review Flow

- Customer can review only:
  - own booking
  - completed booking
  - paid booking
- One review per booking.
- Provider aggregate rating fields are updated after review creation.

## 5) Status Truth and Ownership Rules

### Provider approval vs account state

- Account state comes from `User.isActive` / email verification.
- Provider approval comes from `ProviderProfile.status`.
- Admin/provider UIs use provider status as source of truth for approval.

### Privacy rules

- Nearby job preview is area-only (no exact street, landmark, coords, customer contact).
- Exact address/contact/coordinates are visible only to the assigned provider after acceptance.
- Customer and provider can access only their own booking/payment resources.

## 6) Dispatch Reliability Design

Queue name:

- `dispatch`

Job names:

- `dispatch.booking.created`
- `dispatch.booking.escalate`
- `dispatch.booking.expire`

Reliability principles:

- PostgreSQL is source of truth.
- Workers are idempotent and state-checked.
- Non-critical notifications run after DB writes.
- Booking creation still succeeds if queue enqueue fails (fallback dispatch path exists).

## 7) Caching and Rate Limiting

### Redis cache (safe public data only)

Current cache keys include:

- `services:categories`
- `services:category:<slug>`
- `services:subcategories`
- `locations:provinces`
- `locations:districts:<province>`
- `locations:municipalities:<province>:<district>`
- `public:faqs`

Sensitive/transactional entities are intentionally not cached.

### Rate limiting

Redis-backed limiter with memory fallback:

- Global API limiter
- Auth limiter
- Auth action limiter (OTP/login-sensitive routes)
- Booking creation limiter
- Review creation limiter

All return safe `429` messages.

## 8) API Surface (High-Level)

Base:

- Health: `/health`
- API root: `/api/v1`

Main route groups:

- `/auth`
- `/users`
- `/customer`
- `/provider` and `/providers` (provider router mounted on both paths for compatibility)
- `/services`
- `/subcategories`
- `/bookings`
- `/payments`
- `/reviews`
- `/notifications`
- `/admin`
- `/admin/faqs`
- `/public`
- `/locations`
- `/dashboard`

See also:

- `docs/backend-api-overview.md`
- `SewaFi.postman_collection.json`

## 9) Frontend Route Layout

Public:

- `/`, `/services`, `/services/:id`, `/about`, `/contact`, `/how-it-works`, etc.

Customer app:

- `/customer/dashboard`
- `/customer/book`, `/customer/book/:serviceId`
- `/customer/bookings`, `/customer/bookings/:id`
- `/customer/payments`, `/customer/payments/:bookingId`
- `/customer/addresses`, `/customer/reviews`, `/customer/notifications`

Provider app:

- `/provider/dashboard`
- `/provider/nearby-jobs`
- `/provider/assigned-jobs`
- `/provider/schedule`, `/provider/availability`
- `/provider/earnings`, `/provider/reviews`, `/provider/notifications`

Admin app:

- `/admin/dashboard`
- `/admin/users`, `/admin/providers`, `/admin/bookings`
- `/admin/services`, `/admin/categories`
- `/admin/payments`, `/admin/reviews`
- `/admin/settings`, `/admin/reports`, `/admin/audit-logs`

## 10) Local Development Setup

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Cloudinary account (uploads)
- Resend API key (email OTP/notifications)

## 10.1 Clone

```bash
git clone <repository-url>
cd "Sewafi-Home Services"
```

## 10.2 Backend

```bash
cd backend
npm install
```

Create `backend/.env` (minimum required in current backend):

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

RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_NAME=SewaFi
EMAIL_FROM_ADDRESS=onboarding@resend.dev

CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

PLATFORM_COMMISSION_PERCENT=10
```

Prisma + seed:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run db:seed:locations
```

Run API:

```bash
npm run dev
```

Run dispatch worker (optional in development, recommended in production):

```bash
npm run worker:dispatch
```

Notes:

- In development, API can auto-start dispatch worker (`server.js`) unless disabled.
- In production, run API and worker as separate processes.

## 10.3 Frontend

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

## 11) Operational Commands

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

## 12) Seed Data and Demo Accounts

`backend/prisma/seed.js` creates sample accounts and base service catalog.

Common seeded credentials (if unchanged):

- Admin: `admin@sewafi.com` / `Password@123`
- Customer: `customer@sewafi.com` / `Password@123`
- Provider: `provider@sewafi.com` / `Password@123`

Change these before public deployment.

## 13) Security and Error Handling Notes

- Role guards enforced on backend (`authenticate`, `authorize`, `requireApprovedProvider`).
- Inactive users are blocked at auth middleware.
- Centralized error middleware sanitizes Prisma/internal errors.
- Frontend consumes safe error messages through shared error helpers.
- CORS uses explicit allowed origin list.

## 14) Current Product Constraints

- Online payment gateway integration is not implemented; manual confirmation flow is active.
- FAQ admin uses current `FAQ` model fields (`section`, `sortOrder`, `isActive`) with homepage behavior derived from section/category semantics.
- Some legacy compatibility endpoints remain for smooth frontend migration.

## 15) Repository Structure

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
|  |- tests/
|  |- package.json
|- frontend/
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

## 16) Suggested Deployment Checklist

1. Set strong JWT secrets and production CORS origins.
2. Ensure Redis is reachable for OTP, queue, and rate limiting.
3. Run Prisma migrations (`npm run db:deploy`) before startup.
4. Run API and dispatch worker as separate processes.
5. Confirm Cloudinary + Resend credentials.
6. Verify admin/provider/customer login and end-to-end booking flow.

---

For route-level details and payload references, use:

- `docs/backend-api-overview.md`
- `SewaFi.postman_collection.json`
