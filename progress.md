# Property Operations Platform - Progress Tracker

> This file tracks backend work status. Update checkboxes whenever work completes.

---

## Phase 1: Shared Infrastructure

- [x] `src/lib/roles.guard.ts` - Role-based access guard
- [x] `src/lib/roles.decorator.ts` - `@Roles()` decorator
- [x] `src/lib/mongo-id.pipe.ts` - MongoDB ObjectId validation pipe
- [x] `src/lib/auth-support.module.ts` - shared JWT/auth support for feature modules

## Current Foundation: Auth, User, Upload

- [x] `src/main.ts` - Swagger, validation, global exception filter, security middleware
- [x] `src/lib/all-exceptions.filter.ts` - Global exception handling
- [x] `src/lib/auth.guard.ts` - JWT auth guard
- [x] `src/lib/minio.service.ts` - MinIO upload service
- [x] `src/user/entities/user.entity.ts` - Multi-role global user model with owner/property linkage
- [x] `src/user/dto/create-user.dto.ts`
- [x] `src/user/dto/login.dto.ts`
- [x] `src/user/dto/refresh-token.dto.ts`
- [x] `src/user/dto/link-global-user.dto.ts`
- [x] `src/user/dto/register-worker.dto.ts`
- [x] `src/user/user.service.ts` - bootstrap auth, managed user creation, refresh/logout, global user linking
- [x] `src/user/user.controller.ts`
- [x] `src/user/user.module.ts`
- [x] `src/image/image.service.ts`
- [x] `src/image/image.controller.ts`
- [x] `src/image/image.module.ts`
- [x] `src/uploads/uploads.service.ts`
- [x] `src/uploads/uploads.controller.ts`
- [x] `src/uploads/uploads.module.ts`

## Phase 2: Organization Module

- [x] `src/organization/schema/organization.schema.ts`
- [x] `src/organization/dto/create-organization.dto.ts`
- [x] `src/organization/dto/update-organization.dto.ts`
- [x] `src/organization/dto/query-organization.dto.ts`
- [x] `src/organization/organization.service.ts`
- [x] `src/organization/organization.controller.ts`
- [x] `src/organization/organization.module.ts`

## Phase 3: Property Module

- [x] `src/property/schema/property.schema.ts`
- [x] `src/property/dto/create-property.dto.ts`
- [x] `src/property/dto/update-property.dto.ts`
- [x] `src/property/dto/query-property.dto.ts`
- [x] `src/property/property.service.ts`
- [x] `src/property/property.controller.ts`
- [x] `src/property/property.module.ts`

## Phase 4: Unit Module

- [x] `src/unit/schema/unit.schema.ts`
- [x] `src/unit/dto/create-unit.dto.ts`
- [x] `src/unit/dto/update-unit.dto.ts`
- [x] `src/unit/dto/query-unit.dto.ts`
- [x] `src/unit/unit.service.ts`
- [x] `src/unit/unit.controller.ts`
- [x] `src/unit/unit.module.ts`

## Phase 5: Tenant Module

- [x] `src/tenant/schema/tenant.schema.ts`
- [x] `src/tenant/dto/create-tenant.dto.ts`
- [x] `src/tenant/dto/record-tenant-payment.dto.ts`
- [x] `src/tenant/dto/update-tenant.dto.ts`
- [x] `src/tenant/dto/query-tenant.dto.ts`
- [x] `src/tenant/tenant.service.ts`
- [x] `src/tenant/tenant.controller.ts`
- [x] `src/tenant/tenant.module.ts`

Tenant payment features:
- [x] renter monthly payment tracking
- [x] guest one-time fee tracking
- [x] paid/unpaid month query

## Phase 6: Ticket Module

- [x] `src/ticket/schema/ticket.schema.ts`
- [x] `src/ticket/dto/create-ticket.dto.ts`
- [x] `src/ticket/dto/update-ticket.dto.ts`
- [x] `src/ticket/dto/query-ticket.dto.ts`
- [x] `src/ticket/dto/add-comment.dto.ts`
- [x] `src/ticket/ticket.service.ts`
- [x] `src/ticket/ticket.controller.ts`
- [x] `src/ticket/ticket.module.ts`

## Phase 7: Technician Module

- [x] `src/technician/schema/technician.schema.ts`
- [x] `src/technician/dto/create-technician.dto.ts`
- [x] `src/technician/dto/update-technician.dto.ts`
- [x] `src/technician/dto/query-technician.dto.ts`
- [x] `src/technician/technician.service.ts`
- [x] `src/technician/technician.controller.ts`
- [x] `src/technician/technician.module.ts`

Technician rules:
- [x] technician profile can be global across many owners/properties
- [x] worker user can self-signup

## Phase 8: Work Order Module

- [x] `src/work-order/schema/work-order.schema.ts`
- [x] `src/work-order/dto/create-work-order.dto.ts`
- [x] `src/work-order/dto/update-work-order.dto.ts`
- [x] `src/work-order/dto/query-work-order.dto.ts`
- [x] `src/work-order/work-order.service.ts`
- [x] `src/work-order/work-order.controller.ts`
- [x] `src/work-order/work-order.module.ts`

## Phase 9: Messaging Module

- [x] `src/messaging/entities/message.entity.ts`
- [x] `src/messaging/dto/send-message.dto.ts`
- [x] `src/messaging/dto/send-document.dto.ts`
- [x] `src/messaging/dto/query-message.dto.ts`
- [x] `src/messaging/messaging.gateway.ts`
- [x] `src/messaging/messaging.service.ts`
- [x] `src/messaging/messaging.controller.ts`
- [x] `src/messaging/messaging.module.ts`

Messaging features:
- [x] direct chat
- [x] ticket room chat
- [x] document send to selected users
- [x] typing event gateway

## Phase 10: Announcement Module

- [x] `src/announcement/schema/announcement.schema.ts`
- [x] `src/announcement/dto/create-announcement.dto.ts`
- [x] `src/announcement/dto/update-announcement.dto.ts`
- [x] `src/announcement/dto/query-announcement.dto.ts`
- [x] `src/announcement/announcement.service.ts`
- [x] `src/announcement/announcement.controller.ts`
- [x] `src/announcement/announcement.module.ts`

Announcement/Notice features:
- [x] targeted notice by roles
- [x] targeted notice by users
- [x] notice attachments/doc links

## Phase 11: Inspection Module

- [x] `src/inspection/entities/inspection.entity.ts`
- [x] `src/inspection/dto/create-inspection.dto.ts`
- [x] `src/inspection/dto/update-inspection.dto.ts`
- [x] `src/inspection/dto/query-inspection.dto.ts`
- [x] `src/inspection/inspection.service.ts`
- [x] `src/inspection/inspection.controller.ts`
- [x] `src/inspection/inspection.module.ts`

## Phase 12: Recurring Maintenance Module

- [x] `src/recurring-maintenance/entities/recurring-maintenance.entity.ts`
- [x] `src/recurring-maintenance/dto/create-recurring-maintenance.dto.ts`
- [x] `src/recurring-maintenance/dto/update-recurring-maintenance.dto.ts`
- [x] `src/recurring-maintenance/dto/query-recurring-maintenance.dto.ts`
- [x] `src/recurring-maintenance/recurring-maintenance.service.ts`
- [x] `src/recurring-maintenance/recurring-maintenance.controller.ts`
- [x] `src/recurring-maintenance/recurring-maintenance.module.ts`

## Phase 13: Vendor Module

- [x] `src/vendor/schema/vendor.schema.ts`
- [x] `src/vendor/dto/create-vendor.dto.ts`
- [x] `src/vendor/dto/update-vendor.dto.ts`
- [x] `src/vendor/dto/query-vendor.dto.ts`
- [x] `src/vendor/vendor.service.ts`
- [x] `src/vendor/vendor.controller.ts`
- [x] `src/vendor/vendor.module.ts`

## Phase 14: Subscription Module

- [x] `src/subscription/entities/plan.entity.ts`
- [x] `src/subscription/entities/subscription.entity.ts`
- [x] `src/subscription/dto/create-plan.dto.ts`
- [x] `src/subscription/dto/update-plan.dto.ts`
- [x] `src/subscription/dto/query-plan.dto.ts`
- [x] `src/subscription/dto/create-subscription.dto.ts`
- [x] `src/subscription/subscription.service.ts`
- [x] `src/subscription/subscription.controller.ts`
- [x] `src/subscription/subscription.module.ts`

## Phase 15: Analytics Module

- [x] `src/analytics/analytics.service.ts`
- [x] `src/analytics/analytics.controller.ts`
- [x] `src/analytics/analytics.module.ts`

## Phase 16: App Module Update

- [x] `src/app.module.ts` - Current foundation modules imported (`UserModule`, `ImageModule`, config/JWT/Mongo)
- [x] Import all future MVP modules

## Phase 17: Build Verification

- [x] `npx.cmd tsc --noEmit` passes
- [ ] `npm run build` passes

## Phase 18: Frontend Auth and API Hooks

- [x] `frontend/api-hooks/api-hooks.ts`
- [x] `frontend/api-hooks/react-query-wrapper.ts`
- [x] `frontend/api-hooks/use-api-mutation.ts`
- [x] `frontend/hooks/use-auth.ts`
- [x] `frontend/components/providers.tsx`
- [x] `frontend/components/auth/auth-shell.tsx`
- [x] `frontend/components/auth/login-form.tsx`
- [x] `frontend/components/auth/signup-form.tsx`
- [x] `frontend/app/login/page.tsx`
- [x] `frontend/app/signup/page.tsx`
- [x] `frontend/app/page.tsx`
- [x] `frontend/app/layout.tsx`
- [x] `frontend/app/globals.css`
- [x] `frontend/.env.local`
- [x] `frontend/package.json` query/axios deps added
- [x] `frontend/components/ui/calendar.tsx` type drift fix
- [x] `frontend npm.cmd run typecheck` passes

## Phase 19: Auth Seed, Public Signup, Dashboard Foundation

- [x] `backend/src/user/dto/public-signup.dto.ts`
- [x] `backend/src/user/user-seed.service.ts`
- [x] `backend/src/user/user.controller.ts` public signup route
- [x] `backend/src/user/user.service.ts` public signup logic
- [x] default super admin seed `test@gmail.com` / `11111111`
- [x] `frontend/hooks/use-auth.ts` role redirect + public signup
- [x] `frontend/components/auth/signup-form.tsx` worker/tenant-owner selector
- [x] `frontend/lib/auth-routes.ts`
- [x] `frontend/lib/types/api.ts`
- [x] `frontend/lib/types/dashboard.ts`
- [x] `frontend/hooks/use-admin-dashboard.ts`
- [x] `frontend/hooks/use-image-upload.ts`
- [x] `frontend/components/dashboard/dashboard-shell.tsx`
- [x] `frontend/components/dashboard/dashboard-gate.tsx`
- [x] `frontend/components/dashboard/admin-dashboard.tsx`
- [x] `frontend/components/dashboard/role-placeholder.tsx`
- [x] `frontend/components/shared/image-upload-field.tsx`
- [x] `frontend/app/dashboard/admin/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/page.tsx`
- [x] `frontend/app/dashboard/resident/page.tsx`
- [x] `frontend/app/dashboard/worker/page.tsx`
- [x] `frontend/app/dashboard/page.tsx`
- [x] `npx.cmd tsc --noEmit` passes
- [x] `frontend npm.cmd run typecheck` passes

## Phase 20: Dashboard Hook Parsing And Nullish Safety

- [x] `frontend/hooks/use-admin-dashboard.ts` paged route parsing fixed
- [x] `frontend/components/dashboard/admin-dashboard.tsx` array guards added
- [x] `frontend/lib/types/api.ts` paginated type added
- [x] `backend/src/user/user.service.ts` safe value normalization added
- [x] `backend/src/organization/organization.service.ts` safe slug normalization added
- [x] `backend/src/technician/technician.service.ts` safe email normalization added
- [x] `npx.cmd tsc --noEmit` passes
- [x] `frontend npm.cmd run typecheck` passes

## Phase 21: Light Mode And Shadcn Admin Dashboard

- [x] `frontend/components/theme-provider.tsx` forced light mode
- [x] `frontend/components/ui/sonner.tsx` forced light theme
- [x] `frontend/app/layout.tsx` light body class
- [x] `npx shadcn@latest add dashboard-01 --overwrite --yes`
- [x] `frontend/components/app-sidebar.tsx`
- [x] `frontend/components/chart-area-interactive.tsx`
- [x] `frontend/components/data-table.tsx`
- [x] `frontend/components/section-cards.tsx`
- [x] `frontend/components/site-header.tsx`
- [x] `frontend/components/dashboard/admin-dashboard-block.tsx`
- [x] `frontend/app/dashboard/admin/page.tsx` uses shadcn dashboard block shell
- [x] `frontend npm.cmd run typecheck` passes

## Phase 22: Admin Dashboard Control Panels

- [x] `frontend/hooks/use-admin-actions.ts`
- [x] `frontend/components/dashboard/admin-control-center.tsx`
- [x] `frontend/components/dashboard/admin-dashboard.tsx` wired CRUD controls
- [x] admin create tenant owner
- [x] admin create organization
- [x] admin create property
- [x] admin create tenant
- [x] admin create technician
- [x] admin create plan
- [x] admin create subscription
- [x] admin delete/toggle orgs, properties, tenants, technicians, plans
- [x] admin subscription list added
- [x] `frontend npm.cmd run typecheck` passes

## Phase 23: Tenant Owner Dashboard Upgrade

- [x] `frontend/hooks/use-owner-dashboard.ts`
- [x] `frontend/hooks/use-owner-actions.ts`
- [x] `frontend/components/dashboard/tenant-owner-control-center.tsx`
- [x] `frontend/components/dashboard/tenant-owner-dashboard.tsx`
- [x] `frontend/components/dashboard/tenant-owner-dashboard-block.tsx`
- [x] `frontend/app/dashboard/tenant-owner/page.tsx`
- [x] owner can add multiple properties
- [x] owner can add units
- [x] owner can add worker / renter / guest users
- [x] owner can add tenant records
- [x] owner can add technicians
- [x] owner can send notices
- [x] owner can toggle/delete owner-safe records
- [x] `frontend npm.cmd run typecheck` passes

## Phase 24: Boneyard Skeleton Coverage

- [x] `frontend/bones/registry.ts`
- [x] `frontend/app/layout.tsx` boneyard registry import
- [x] `frontend/components/dashboard/dashboard-loading.tsx` shared boneyard fallbacks
- [x] `frontend/components/auth/login-form.tsx` boneyard loading state
- [x] `frontend/components/auth/signup-form.tsx` boneyard loading state
- [x] `frontend/components/shared/image-upload-field.tsx` boneyard loading state
- [x] `frontend/components/dashboard/admin-dashboard.tsx` broader skeleton wrappers
- [x] `frontend/components/dashboard/tenant-owner-dashboard.tsx` broader skeleton wrappers
- [x] `frontend npm.cmd run typecheck` passes

## Phase 25: Shared Dashboard Logout

- [x] `frontend/components/nav-user.tsx` real logout action wired
- [x] `frontend/components/app-sidebar.tsx` live auth user data wired
- [x] `frontend/components/site-header.tsx` header logout button added
- [x] admin bare dashboard logout added
- [x] tenant owner bare dashboard logout added
- [x] resident/worker shared shell logout already active
- [x] `frontend npm.cmd run typecheck` passes

## Phase 26: Tenant Owner Dedicated Pages

- [x] `frontend/components/app-sidebar.tsx` role-based tenant owner page nav
- [x] `frontend/components/nav-main.tsx` real sidebar links
- [x] `frontend/components/nav-secondary.tsx` active link support
- [x] `frontend/components/dashboard/tenant-owner-shell.tsx`
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx`
- [x] `frontend/components/dashboard/tenant-owner-dashboard.tsx` modal control center removed from overview
- [x] `frontend/app/dashboard/tenant-owner/properties/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/units/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/users/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/tenants/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/technicians/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/notices/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/settings/page.tsx`
- [x] direct property dropdown / assignment UI added for owner flows
- [x] owner settings page added
- [x] `frontend npm.cmd run typecheck` passes

## Phase 27: Owner Sheet Creation Flow And Org Bootstrap

- [x] `backend/src/user/user.module.ts` organization model wired for owner signup bootstrap
- [x] `backend/src/user/user.service.ts` tenant owner public signup auto-creates organization
- [x] `backend/src/user/user.service.ts` tenant owner login auto-heals missing organization
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` create flows moved into sheets
- [x] property create sheet expanded to full property entity fields
- [x] create sheet closes automatically on successful create
- [x] list/query refresh still happens automatically after create
- [x] removed owner org warning banner from tenant owner create pages
- [x] `frontend npm.cmd run typecheck` passes
- [x] `npx.cmd tsc --noEmit` passes

## Phase 28: Public Signup Expansion And Assignment Requests

- [x] `backend/src/user/entities/assignment-request.entity.ts`
- [x] `backend/src/user/dto/search-users.dto.ts`
- [x] `backend/src/user/dto/create-assignment-request.dto.ts`
- [x] `backend/src/user/dto/update-assignment-request-status.dto.ts`
- [x] `backend/src/user/user.controller.ts` search + assignment request routes
- [x] `backend/src/user/user.service.ts` public signup extended to worker/renter/guest/tenant owner
- [x] `backend/src/user/user.service.ts` owner search by email/name
- [x] `backend/src/user/user.service.ts` owner-to-user and user-to-owner request flow
- [x] `frontend/components/shared/upload-collection-field.tsx`
- [x] `frontend/hooks/use-file-upload.ts`
- [x] `frontend/hooks/use-owner-dashboard.ts` owner user search hook
- [x] `frontend/hooks/use-owner-actions.ts` owner assignment request hook
- [x] `frontend/components/auth/signup-form.tsx` signup roles expanded
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` sheet width 50%, upload components, owner search/request flow
- [x] `frontend npm.cmd run typecheck` passes
- [x] `npx.cmd tsc --noEmit` passes

## Phase 29: Tenant Owner Operations Pages

- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` notices supports role/user targeting
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` document send page added
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` ticket page added with image upload
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` drag/drop ticket assignment to worker
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` work order page added
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` recurring maintenance page added
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` inspection page added
- [x] `frontend/components/app-sidebar.tsx` owner sidebar extended for ops pages
- [x] `frontend/hooks/use-owner-dashboard.ts` work order / inspection / recurring / messages queries
- [x] `frontend/hooks/use-owner-actions.ts` document / ticket / work-order / inspection / recurring mutations
- [x] `frontend/app/dashboard/tenant-owner/documents/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/tickets/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/work-orders/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/recurring/page.tsx`
- [x] `frontend/app/dashboard/tenant-owner/inspections/page.tsx`
- [x] `frontend npm.cmd run typecheck` passes
- [x] `npx.cmd tsc --noEmit` passes

## Phase 30: Sheet Width And Upload UI Polish

- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` sheet width forced to 50% on desktop
- [x] `frontend/components/shared/upload-collection-field.tsx` upgraded to professional browse/upload card UI
- [x] placeholder/helper copy improved for upload flow
- [x] `frontend npm.cmd run typecheck` passes

## Phase 31: Tenant Owner Payments, Vendors, Ops Overview

- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` tenant payment month tracker added
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` vendor page added
- [x] `frontend/components/dashboard/tenant-owner-pages.tsx` owner ticket assign copy clarified to owner-linked workers only
- [x] `frontend/components/dashboard/tenant-owner-dashboard.tsx` vendor / work-order / recurring / inspection analytics surfaced in overview
- [x] `frontend/components/app-sidebar.tsx` vendor route added to tenant owner nav
- [x] `frontend/app/dashboard/tenant-owner/vendors/page.tsx`
- [x] mobile full-width + desktop 50vw sheet behavior kept
- [x] `frontend npm.cmd run typecheck` passes

## Phase 32: Sidebar Grouping And Admin Plan Builder

- [x] `frontend/components/nav-main.tsx` sidebar grouped sections support added
- [x] `frontend/components/app-sidebar.tsx` tenant owner nav organized by category
- [x] `frontend/components/app-sidebar.tsx` admin/worker/resident nav normalized to grouped structure
- [x] `frontend/components/dashboard/admin-dashboard.tsx` inline add-plan form added
- [x] `frontend/components/dashboard/admin-dashboard.tsx` plan features + limits visible in plans tab
- [x] `frontend npm.cmd run typecheck` passes

## Phase 33: SaaS Landing Page Redesign

- [x] `frontend/app/page.tsx` rebuilt to SaaS landing page matching provided design direction
- [x] hero now focuses on problem/solution messaging, not generic feature dump
- [x] notice, payments, workers, tickets, documents, multi-property value surfaced in landing copy
- [x] warm gradient hero + polished product mock sections added
- [x] dark showcase band + before/after + CTA sections added
- [x] mobile-responsive landing flow preserved
- [x] `frontend npm.cmd run typecheck` passes

## Phase 34: Public Plans And Paddle Landing Checkout

- [x] `backend/src/subscription/public-subscription.controller.ts` public active plans endpoint added
- [x] `backend/src/subscription/subscription.service.ts` public-safe plan mapping added
- [x] `backend/src/subscription/subscription.module.ts` public controller wired
- [x] `frontend/hooks/use-public-plans.ts` landing plan query added
- [x] `frontend/hooks/use-paddle-checkout.ts` safe Paddle overlay checkout loader added
- [x] `frontend/components/marketing/marketing-landing.tsx` expanded landing with more sections and live pricing cards
- [x] `frontend/.env.local` Paddle public env placeholders added
- [x] `frontend/lib/types/dashboard.ts` plan Paddle fields added
- [x] `frontend npm.cmd run typecheck` passes
- [x] `backend npx.cmd tsc --noEmit` passes

## Phase 35: Landing Layout Breathing Room And FAQ Polish

- [x] `frontend/components/marketing/marketing-landing.tsx` widened big-screen containers
- [x] hero and section grids relaxed to reduce squished layout on large displays
- [x] FAQ rebuilt with accordion card layout and clearer visual hierarchy
- [x] `frontend npm.cmd run typecheck` passes

## Phase 36: Hero Section Rebalance

- [x] `frontend/components/marketing/marketing-landing.tsx` hero headline rewritten for better line rhythm
- [x] hero left column now uses supporting feature cards instead of awkward giant text stack
- [x] hero CTA and trust/value row rebalanced for desktop and mobile
- [x] `frontend npm.cmd run typecheck` passes

## Phase 37: Hero Title Top Layout

- [x] `frontend/components/marketing/marketing-landing.tsx` hero title moved to top-centered layout
- [x] left side reduced to supporting cards/CTA so hero no longer feels text-heavy
- [x] `frontend npm.cmd run typecheck` passes

## Phase 38: Admin Dedicated Control Pages

- [x] `frontend/components/dashboard/admin-shell.tsx` added shared admin routed shell
- [x] `frontend/components/dashboard/admin-dashboard.tsx` modal control center removed from overview
- [x] `frontend/components/dashboard/admin-pages.tsx` added dedicated admin page components
- [x] `frontend/components/app-sidebar.tsx` admin sidebar expanded into grouped dedicated pages
- [x] `frontend/app/dashboard/admin/users/page.tsx`
- [x] `frontend/app/dashboard/admin/organizations/page.tsx`
- [x] `frontend/app/dashboard/admin/plans/page.tsx`
- [x] `frontend/app/dashboard/admin/properties/page.tsx`
- [x] `frontend/app/dashboard/admin/tenants/page.tsx`
- [x] `frontend/app/dashboard/admin/technicians/page.tsx`
- [x] `frontend/app/dashboard/admin/subscriptions/page.tsx`
- [x] `frontend npm.cmd run typecheck` passes

## Phase 39: Plan Paddle Auto Sync

- [x] `backend/src/subscription/dto/create-plan.dto.ts` raw Paddle id fields removed from create payload
- [x] `backend/src/subscription/subscription.service.ts` auto-creates Paddle product + monthly/yearly prices when API key exists
- [x] `backend/.env.local` Paddle currency/env config kept for auto sync flow
- [x] `frontend/hooks/use-admin-actions.ts` plan mutation payload cleaned of raw Paddle ids
- [x] `frontend/components/dashboard/admin-pages.tsx` admin plan UI switched to automatic Paddle sync messaging
- [x] `frontend/components/dashboard/admin-control-center.tsx` fallback admin plan form cleaned of raw Paddle ids
- [x] `backend npx.cmd tsc --noEmit` passes
- [x] `frontend npm.cmd run typecheck` passes
