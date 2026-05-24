# Property Operations Platform - Backend Implementation Plan

## Overview

Build complete backend for Property Operations Platform SaaS based on `plan.md`.

Current base already done:
- `User` module
- `Image` module
- `Uploads` module
- auth foundation
- Swagger/bootstrap setup
- MinIO upload setup

Need next 10 MVP modules built with same NestJS pattern.

## Goals

1. Organization Management - Multi-tenant SaaS foundation with organization CRUD and org-scoped data
2. Property Management - Full property lifecycle with categories, images, and documents
3. Unit Management - Units/rooms/apartments with occupancy tracking
4. Tenant Management - Tenant profiles, lease info, emergency contacts, unit assignment
5. Maintenance Ticket System - Issue tracking with priorities, categories, statuses, and timeline
6. Technician Management - Staff management with skills, availability, and workload
7. Work Order System - Scheduled maintenance tasks with assignments and completion tracking
8. Announcement System - Organization and property-wide notices with scheduling
9. Vendor Management - External vendor contacts, categories, and service history
10. Analytics Dashboard - Aggregated metrics for tickets, occupancy, and performance

---

## Architecture Decisions

### Data Scoping

Every collection except `users` and `organizations` includes `organizationId`.
All scoped queries use authenticated user JWT payload.

### GET Requests

All GET/list endpoints use query params via dedicated Query DTOs.

### Role-Based Access

Use `RolesGuard` + `@Roles()` with `AuthGuard`.

Status:
- Completed: `src/lib/roles.guard.ts`
- Completed: `src/lib/roles.decorator.ts`
- Completed: `src/lib/mongo-id.pipe.ts`

### Response Pattern

Target consistent success response wrapper later.

---

## Current Completed Foundation

- `src/main.ts` upgraded with Swagger, validation, CORS, helmet, compression, cookie parser
- `src/lib/all-exceptions.filter.ts` added
- `src/lib/auth.guard.ts` added
- `src/lib/minio.service.ts` added
- `src/lib/auth-support.module.ts` added
- `src/user/*` upgraded into first real auth/user foundation
- `src/image/*` added for MinIO-backed image upload
- `src/uploads/*` added for docs/videos/images upload
- `src/app.module.ts` wired for config, JWT, MongoDB, user, image

User foundation now supports:
- bootstrap first admin/super admin
- `admin`/`super_admin` creates `tetentwoner`
- `tetentwoner` creates `worker` / `renter` / `guest`
- worker/renter/guest can become global profiles
- later linking same user to more owners/properties
- worker can self-signup globally
- access token + refresh token

---

## Proposed Changes

### Phase 1: Shared Infrastructure

- [Done] `src/lib/roles.guard.ts`
- [Done] `src/lib/roles.decorator.ts`
- [Done] `src/lib/mongo-id.pipe.ts`

### Phase 2: Organization Module

- [New] `src/organization/schema/organization.schema.ts`
  Fields: name, slug, email, phone, address, logo, settings, subscriptionStatus, isActive
- [New] `src/organization/dto/create-organization.dto.ts`
- [New] `src/organization/dto/update-organization.dto.ts`
- [New] `src/organization/dto/query-organization.dto.ts`
- [New] `src/organization/organization.service.ts`
- [New] `src/organization/organization.controller.ts`
- [New] `src/organization/organization.module.ts`

Status: Done

### Phase 3: Property Module

- [New] `src/property/schema/property.schema.ts`
  Fields: organizationId, name, type, address, description, images[], documents[], totalUnits, isActive
- [New] `src/property/dto/create-property.dto.ts`
- [New] `src/property/dto/update-property.dto.ts`
- [New] `src/property/dto/query-property.dto.ts`
- [New] `src/property/property.service.ts`
- [New] `src/property/property.controller.ts`
- [New] `src/property/property.module.ts`

Status: Done

### Phase 4: Unit Module

- [New] `src/unit/schema/unit.schema.ts`
- [New] `src/unit/dto/create-unit.dto.ts`
- [New] `src/unit/dto/update-unit.dto.ts`
- [New] `src/unit/dto/query-unit.dto.ts`
- [New] `src/unit/unit.service.ts`
- [New] `src/unit/unit.controller.ts`
- [New] `src/unit/unit.module.ts`

Status: Done

### Phase 5: Tenant Module

- [New] `src/tenant/schema/tenant.schema.ts`
- [New] `src/tenant/dto/create-tenant.dto.ts`
- [New] `src/tenant/dto/update-tenant.dto.ts`
- [New] `src/tenant/dto/query-tenant.dto.ts`
- [New] `src/tenant/tenant.service.ts`
- [New] `src/tenant/tenant.controller.ts`
- [New] `src/tenant/tenant.module.ts`

Status: Done

### Phase 6: Ticket Module

- [New] `src/ticket/schema/ticket.schema.ts`
- [New] `src/ticket/dto/create-ticket.dto.ts`
- [New] `src/ticket/dto/update-ticket.dto.ts`
- [New] `src/ticket/dto/query-ticket.dto.ts`
- [New] `src/ticket/dto/add-comment.dto.ts`
- [New] `src/ticket/ticket.service.ts`
- [New] `src/ticket/ticket.controller.ts`
- [New] `src/ticket/ticket.module.ts`

Status: Done

### Phase 7: Technician Module

- [New] `src/technician/schema/technician.schema.ts`
- [New] `src/technician/dto/create-technician.dto.ts`
- [New] `src/technician/dto/update-technician.dto.ts`
- [New] `src/technician/dto/query-technician.dto.ts`
- [New] `src/technician/technician.service.ts`
- [New] `src/technician/technician.controller.ts`
- [New] `src/technician/technician.module.ts`

Status: Done

### Phase 8: Work Order Module

- [New] `src/work-order/schema/work-order.schema.ts`
- [New] `src/work-order/dto/create-work-order.dto.ts`
- [New] `src/work-order/dto/update-work-order.dto.ts`
- [New] `src/work-order/dto/query-work-order.dto.ts`
- [New] `src/work-order/work-order.service.ts`
- [New] `src/work-order/work-order.controller.ts`
- [New] `src/work-order/work-order.module.ts`

Status: Done

### Phase 9: Messaging Module

- [Done] `src/messaging/entities/message.entity.ts`
- [Done] `src/messaging/dto/send-message.dto.ts`
- [Done] `src/messaging/dto/send-document.dto.ts`
- [Done] `src/messaging/dto/query-message.dto.ts`
- [Done] `src/messaging/messaging.gateway.ts`
- [Done] `src/messaging/messaging.service.ts`
- [Done] `src/messaging/messaging.controller.ts`
- [Done] `src/messaging/messaging.module.ts`

Status: Done

Extra delivered:
- direct user-to-user doc sending
- role/user targeted notices

### Phase 10: Announcement Module

- [New] `src/announcement/schema/announcement.schema.ts`
- [New] `src/announcement/dto/create-announcement.dto.ts`
- [New] `src/announcement/dto/update-announcement.dto.ts`
- [New] `src/announcement/dto/query-announcement.dto.ts`
- [New] `src/announcement/announcement.service.ts`
- [New] `src/announcement/announcement.controller.ts`
- [New] `src/announcement/announcement.module.ts`

Status: Done

### Phase 11: Inspection Module

- [Done] `src/inspection/entities/inspection.entity.ts`
- [Done] `src/inspection/dto/create-inspection.dto.ts`
- [Done] `src/inspection/dto/update-inspection.dto.ts`
- [Done] `src/inspection/dto/query-inspection.dto.ts`
- [Done] `src/inspection/inspection.service.ts`
- [Done] `src/inspection/inspection.controller.ts`
- [Done] `src/inspection/inspection.module.ts`

Status: Done

### Phase 12: Recurring Maintenance Module

- [Done] `src/recurring-maintenance/entities/recurring-maintenance.entity.ts`
- [Done] `src/recurring-maintenance/dto/create-recurring-maintenance.dto.ts`
- [Done] `src/recurring-maintenance/dto/update-recurring-maintenance.dto.ts`
- [Done] `src/recurring-maintenance/dto/query-recurring-maintenance.dto.ts`
- [Done] `src/recurring-maintenance/recurring-maintenance.service.ts`
- [Done] `src/recurring-maintenance/recurring-maintenance.controller.ts`
- [Done] `src/recurring-maintenance/recurring-maintenance.module.ts`

Status: Done

### Phase 13: Vendor Module

- [New] `src/vendor/schema/vendor.schema.ts`
- [New] `src/vendor/dto/create-vendor.dto.ts`
- [New] `src/vendor/dto/update-vendor.dto.ts`
- [New] `src/vendor/dto/query-vendor.dto.ts`
- [New] `src/vendor/vendor.service.ts`
- [New] `src/vendor/vendor.controller.ts`
- [New] `src/vendor/vendor.module.ts`

Status: Done

### Phase 14: Subscription and Billing Module

- [Done] `src/subscription/entities/plan.entity.ts`
- [Done] `src/subscription/entities/subscription.entity.ts`
- [Done] `src/subscription/dto/create-plan.dto.ts`
- [Done] `src/subscription/dto/update-plan.dto.ts`
- [Done] `src/subscription/dto/query-plan.dto.ts`
- [Done] `src/subscription/dto/create-subscription.dto.ts`
- [Done] `src/subscription/subscription.service.ts`
- [Done] `src/subscription/subscription.controller.ts`
- [Done] `src/subscription/subscription.module.ts`

Paddle behavior:
- uses placeholder config fields
- if Paddle env/api key missing, logs warning and returns `paddle: null`
- no crash on missing Paddle setup
- plan create no longer asks admin for raw Paddle ids
- backend now auto-creates Paddle product + monthly/yearly prices when config exists and stores returned ids

Status: Done

### Phase 15: Analytics Module

- [New] `src/analytics/analytics.service.ts`
- [New] `src/analytics/analytics.controller.ts`
- [New] `src/analytics/analytics.module.ts`

Status: Done

### Phase 16: App Module Update

- [Done] `src/app.module.ts`
  Current: config/JWT/Mongo + all current modules wired

### Phase 17: Frontend Auth Foundation

- [Done] `frontend/api-hooks/api-hooks.ts`
- [Done] `frontend/api-hooks/react-query-wrapper.ts`
- [Done] `frontend/api-hooks/use-api-mutation.ts`
- [Done] `frontend/hooks/use-auth.ts`
- [Done] `frontend/components/providers.tsx`
- [Done] `frontend/components/auth/*`
- [Done] `frontend/app/login/page.tsx`
- [Done] `frontend/app/signup/page.tsx`
- [Done] `frontend/app/page.tsx`
- [Done] `frontend/.env.local`

Frontend behavior:
- uses source-style API hook pattern adapted to this app
- uses React Query custom hooks for auth/api flow
- blue mobile-first auth UI
- signup page supports worker + tenant owner public signup
- login uses shared `/user/login`

Frontend dashboard foundation:
- reusable 4-role dashboard shell added
- admin dashboard implemented first with live API data
- resident / worker / tenant owner pages scaffolded in same module pattern
- reusable image upload component added
- light mode forced for now
- `shadcn` `dashboard-01` block added and wired for admin route
- admin dashboard now includes create/list/delete/toggle controls for core modules
- tenant owner dashboard now upgraded to same full block style with owner-safe controls
- `boneyard-js` skeleton wrappers expanded across auth, upload, admin, tenant owner dashboards
- `frontend/bones/registry.ts` added so boneyard registry can grow later without layout churn
- shared logout UX now wired in dashboard header/sidebar for admin and tenant owner, with worker/resident using existing shell logout
- tenant owner modal control area split into dedicated routed pages with sidebar navigation
- owner property assignment now uses direct selectors instead of raw id text fields
- owner settings page added for subscription/org status and owner rules
- tenant owner create actions now open in sheets, auto-close on success, and rely on existing query invalidation for instant refetch
- tenant owner public signup/login now auto-bootstrap organization so property create no longer hits missing `organizationId` wall
- property create UI now exposes broader backend entity fields instead of only minimal subset
- public signup now supports worker, renter, guest, and tenant owner
- owner assignment flow now prefers searching signed-up users by email/name and sending assignment requests instead of blind manual creation
- upload fields now use actual device file/image upload components instead of asking users to paste URLs
- tenant owner ops UI now includes documents, tickets, drag/drop worker assignment, work orders, recurring maintenance, and inspections
- owner notices/documents now support specific selected users in frontend flow
- tenant owner tenant page now includes month-wise renter/guest payment tracking UI
- tenant owner vendor management page now added to sidebar and routed pages
- tenant owner overview now surfaces vendor/work-order/recurring/inspection analytics
- worker assignment copy clarified in ticket UI to owner-linked workers only
- dashboard sidebar navigation now grouped by category instead of one flat owner list
- admin plans tab now includes direct plan creation UI for features and limits
- marketing landing page now redesigned in premium SaaS style inspired by provided references, with stronger problem/solution positioning for notices, payments, workers, and operations
- public active plans feed now exists for landing page pricing
- landing page now supports safe Paddle overlay checkout when public client token and price IDs are configured
- landing layout now widened for large screens and FAQ upgraded to better accordion UX
- hero section now rebalanced with cleaner headline rhythm and better left-column support blocks
- hero title now moved to top-centered layout to avoid awkward heavy left text stack
- admin dashboard controls now split into dedicated routed pages, same pattern as tenant owner
- admin/fallback plan creation UIs now hide raw Paddle ids and explain automatic sync instead

Backend auth additions:
- fixed default super admin seed on boot: `test@gmail.com` / `11111111`
- public signup route added for `worker` and `tetentwoner`
- runtime safety patched with more `??` and normalized string guards
- admin dashboard paged hook parsing fixed for wrapped collection routes

---

## Verification Plan

### Automated

- `npx.cmd tsc --noEmit`
- `npm run build`
- `frontend npm.cmd run typecheck`

### Manual

- test CRUD in Swagger
- test query filtering
- test role restrictions
- test org-scoped access
