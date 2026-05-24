# Property Operations Platform

## Overview

Property Operations Platform is a SaaS web application for managing property operations, maintenance workflows, tenant communication, technician tasks, inspections, and property-related activities from one centralized dashboard.

The platform is designed for:

- Apartment Buildings
- Rental Companies
- Vacation Rentals
- Hotels
- Coworking Spaces
- Offices
- Residential Buildings
- Small Property Management Companies

The main goal is to replace:

- WhatsApp groups
- Excel sheets
- Phone-call coordination
- Manual maintenance tracking
- Scattered tenant communication

with one structured platform.

---

# Architecture

## Database Strategy

The platform uses:

- Single MongoDB Database
- Shared Collections
- Organization-based data filtering

Each organization/company has:

- its own properties
- its own tenants
- its own technicians
- its own tickets
- its own data scope

using:

```js
organizationId;
```

inside collections.

---

# Tech Stack

## Backend

- NestJS

## Database

- MongoDB

## File Storage

- MinIO

## Realtime

- Socket.IO / WebSockets

## Authentication

- JWT + Refresh Token

## Payments

- Paddle

---

# User Roles

# 1. Platform Owner (Super Admin)

The SaaS owner.

## Features

- Manage organizations
- Manage subscriptions
- Suspend organizations
- View platform analytics
- Manage plans
- View total usage
- Platform announcements

---

# 2. Organization Admin

The paying customer/property owner.

## Features

- Manage properties
- Manage units
- Add tenants
- Add staff
- Assign technicians
- Track maintenance
- View analytics
- Manage organization settings

---

# 3. Property Manager

Daily operations manager.

## Features

- Handle tickets
- Assign technicians
- Manage recurring maintenance
- View reports
- Manage inspections
- Monitor operations

---

# 4. Technician

Maintenance worker/staff member.

## Features

- View assigned tasks
- Update task progress
- Upload completion photos
- Add notes
- Mark work completed
- View schedules

---

# 5. Tenant / Guest / Resident

End user.

## Features

- Submit issues
- Upload images/videos
- Track repair status
- Receive updates
- Chat with management
- View notices

---

# Core Modules

# 1. Organization Management

## Features

- Create organization
- Edit organization
- Organization profile
- Logo upload
- Organization settings
- Subscription status
- Organization analytics

---

# 2. Property Management

## Features

- Create property
- Edit property
- Delete property
- Property categories
- Building management
- Floor management
- Unit management
- Property images
- Property documents

## Property Types

- Apartment
- Hotel
- Villa
- Office
- Coworking Space
- Vacation Rental

---

# 3. Unit Management

## Features

- Add unit/apartment/room
- Unit number
- Unit status
- Occupancy status
- Unit notes
- Assign tenant
- Unit images

## Unit Status

- Vacant
- Occupied
- Maintenance
- Reserved

---

# 4. Tenant Management

## Features

- Add tenant
- Edit tenant
- Remove tenant
- Assign unit
- Emergency contact
- Lease start/end date
- Upload tenant documents
- Tenant activity history

## Tenant Information

- Full Name
- Email
- Phone Number
- Address
- Emergency Contact
- Lease Information
- Notes

---

# 5. Maintenance Ticket System

## Features

- Create ticket
- Upload photo/video
- Emergency priority
- Assign technician
- Add comments
- Internal notes
- Track ticket timeline
- Ticket history
- Reopen ticket
- Ticket filtering

## Ticket Categories

- Plumbing
- Electrical
- HVAC
- Cleaning
- Appliance
- Security
- Internet
- Structural
- General

## Ticket Priorities

- Low
- Medium
- High
- Emergency

## Ticket Status

- Open
- Assigned
- In Progress
- Waiting Parts
- Completed
- Cancelled
- Escalated

---

# 6. Technician Management

## Features

- Add technician
- Edit technician
- Assign tasks
- Technician schedule
- Technician workload
- Task completion tracking
- Technician activity history

## Technician Information

- Name
- Phone
- Email
- Skills
- Availability
- Assigned Properties

---

# 7. Work Order System

## Features

- Create work order
- Assign technician
- Schedule maintenance
- Set due date
- Add repair notes
- Upload completion proof
- Track progress
- Completion verification

---

# 8. Realtime Messaging System

## Features

- Tenant ↔ Management Chat
- Technician ↔ Manager Chat
- Ticket-based chat rooms
- Realtime messaging
- Typing indicator
- Message read status
- File/image sharing

---

# 9. Announcement System

## Features

- Create announcements
- Send organization-wide notice
- Property-specific announcements
- Emergency announcements
- Scheduled announcements

## Example Notices

- Water shutdown
- Elevator maintenance
- Internet downtime
- Building notice
- Security notice

---

# 10. Inspection Management

## Features

- Create inspection
- Move-in inspection
- Move-out inspection
- Damage reports
- Checklist system
- Upload inspection photos
- Export inspection report

---

# 11. Recurring Maintenance System

## Features

- Schedule recurring maintenance
- Auto-create maintenance tasks
- Reminder system
- Preventive maintenance tracking

## Examples

- AC servicing
- Elevator inspection
- Fire extinguisher check
- Water tank cleaning

---

# 12. Vendor Management

## Features

- Add vendors
- Vendor categories
- Vendor contacts
- Service history
- Vendor notes

## Vendor Types

- Electrician
- Plumber
- HVAC
- Cleaning
- Security
- General Contractor

---

# 13. Analytics Dashboard

## Metrics

- Total tickets
- Open tickets
- Emergency tickets
- Average repair time
- Technician performance
- Maintenance costs
- Property activity
- Occupancy insights

---

# 14. File Management

## Features

- Upload documents
- Upload images
- Upload videos
- File preview
- File categorization
- MinIO storage integration

## Supported Files

- Images
- Videos
- PDFs
- Documents

---

# 15. Subscription & Billing

## Paddle Integration

## Features

- Monthly subscriptions
- Yearly subscriptions
- Organization plan management
- Billing history
- Subscription status
- Plan upgrades/downgrades

---

# Authentication System

## Features

- Email login
- JWT authentication
- Refresh tokens
- Password reset
- Role-based access
- Session management

---

# Dashboard Features

# Admin Dashboard

## Widgets

- Open tickets
- Emergency issues
- Technician workload
- Recent activity
- Property overview
- Occupancy stats

---

# Technician Dashboard

## Widgets

- Assigned tasks
- Today's schedule
- Pending work orders
- Completion stats

---

# Tenant Dashboard

## Widgets

- Submitted tickets
- Ticket status
- Announcements
- Chat messages

---

# Search & Filtering

## Features

- Global search
- Ticket filters
- Property filters
- Tenant filters
- Technician filters
- Date filtering
- Status filtering

---

# Audit & Activity Logs

## Features

- User activity logs
- Ticket history logs
- Login history
- System changes
- Action tracking

---

# Security

## Features

- Role-based permissions
- Secure file upload
- JWT authentication
- Protected routes
- Organization-based access control

---

# Initial MVP Scope

## Build First

- Authentication
- Organization system
- Property management
- Unit management
- Tenant management
- Ticket system
- Technician management
- Work orders
- Realtime messaging
- Dashboard
- File uploads
- Paddle subscriptions

---

# Future Expansion (Not Now)

- SMS notifications
- Push notifications
- WhatsApp integration
- Mobile apps
- Visitor management
- Facility booking
- AI automation
- IoT integrations
- Accounting integrations

---

# Suggested Project Structure

## Backend Modules

- auth
- users
- organizations
- properties
- units
- tenants
- technicians
- tickets
- work-orders
- messaging
- announcements
- inspections
- recurring-maintenance
- vendors
- analytics
- uploads
- subscriptions

---

# Recommended SaaS Plans

## Starter

- Small buildings
- Basic ticketing
- Limited users

## Growth

- Multiple properties
- Advanced analytics
- More staff accounts

## Enterprise

- Unlimited properties
- White-label
- Priority support

---

# Product Positioning

Do not market this as:

- Maintenance App
- Repair Ticket Tool

Market this as:

# Property Operations Platform

or

# Modern Property Operations SaaS

or

# Property Maintenance & Operations Platform

because it sounds more valuable and scalable.
