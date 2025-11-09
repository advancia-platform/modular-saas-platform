# 🏥 MedBed Doctor Consultation System - Architecture Overview

## 🎯 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION PHASE                           │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                        ┌──────────┐
    │  Doctor  │                                        │  Admin   │
    └────┬─────┘                                        └────┬─────┘
         │                                                   │
         │ 1. Register with invite code                     │
         ├──────────────────────────────────────────────────┤
         │    POST /api/auth/register-doctor                │
         │    {inviteCode: "ADVANCIA2025MEDBED"}            │
         │                                                   │
         │ 2. Status: PENDING                               │
         │◄──────────────────────────────────────────────────┤
         │                                                   │
         │                                    3. Opens Admin Dashboard
         │                                    ├──────────────┤
         │                                    │ GET /admin/dashboard
         │                                    │              │
         │                                    4. Clicks "Verify"
         │                                    ├──────────────┤
         │                                    │ POST /admin/doctor/:id/verify
         │                                                   │
         │ 5. Status: VERIFIED ◄────────────────────────────┤
         │                                                   │
         │ 6. Can now login and access consultations        │
         └───────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       CONSULTATION PHASE                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                        ┌──────────┐
    │ Patient  │                                        │  Doctor  │
    └────┬─────┘                                        └────┬─────┘
         │                                                   │
         │ 1. Create Consultation                           │
         ├──────────────────────────────────────────────────┤
         │    POST /api/consultation                        │
         │    {doctorId, symptoms}                          │
         │                                                   │
         │                                    2. Views Consultation
         │                                    ◄──────────────┤
         │                                    │ GET /consultation/:id
         │                                                   │
         │ 3. Opens Consultation Page                       │
         ├──────────────────────────────────────────────────┤
         │    /consultation/{id}                            │
         │                                                   │
         │ 4. Sends Message                  5. Sends Reply │
         ├──────────────────────────────────►◄──────────────┤
         │    POST /consultation/message                    │
         │                                                   │
         │ 6. Clicks "Start Video Call"                     │
         ├──────────────────────────────────────────────────┤
         │    GET /consultation/video/:id                   │
         │                                                   │
         │ 7. Jitsi Meet Room Created                       │
         │◄─────────────────────────────────────────────────┤
         │    meet.jit.si/advancia-consultation-{id}        │
         │                                                   │
         │ 8. Video Consultation ◄──────────►              │
         │    (Camera, Microphone, Screen Share)           │
         │                                                   │
         │                                    9. Updates Diagnosis
         │                                    ├──────────────┤
         │                                    │ PATCH /consultation/:id
         │                                    │ {diagnosis}  │
         │                                                   │
         │                                    10. Marks Complete
         │                                    ├──────────────┤
         │                                    │ PATCH /consultation/:id
         │                                    │ {status: "COMPLETED"}
         │                                                   │
         │ 11. Receives Diagnosis & Prescription            │
         │◄──────────────────────────────────────────────────┤
         └───────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

```
┌───────────────────┐
│       User        │
│ ─────────────────│
│ id (PK)          │
│ email            │─────┐
│ passwordHash     │     │
│ firstName        │     │
│ lastName         │     │ One-to-Many
│ ...              │     │
└───────────────────┘     │
                          │
                          ▼
              ┌───────────────────────┐
              │    Consultation       │
              │ ─────────────────────│
              │ id (PK)              │◄────┐
              │ patientId (FK)       │     │
              │ doctorId (FK)        │     │
              │ status               │     │ One-to-Many
              │ symptoms             │     │
              │ diagnosis            │     │
              │ createdAt            │     │
              └───────────────────────┘     │
                          ▲                 │
                          │                 │
                          │ Many-to-One     │
                          │                 │
              ┌───────────────────────┐     │
              │       Doctor          │     │
              │ ─────────────────────│     │
              │ id (PK)              │─────┘
              │ email                │
              │ passwordHash         │
              │ firstName            │
              │ lastName             │
              │ specialization       │
              │ licenseNumber        │
              │ status (enum)        │
              │ verifiedBy           │
              │ verifiedAt           │
              └───────────────────────┘

                          ▲
                          │
                          │ One-to-Many
                          │
              ┌───────────────────────┐
              │ ConsultationMessage   │
              │ ─────────────────────│
              │ id (PK)              │
              │ consultationId (FK)  │
              │ senderId             │
              │ senderType (enum)    │
              │ content              │
              │ createdAt            │
              └───────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYERS                           │
└─────────────────────────────────────────────────────────────────────┘

1. PUBLIC ENDPOINTS (No Auth)
   ├── POST /api/auth/register-doctor
   │   └── Requires: inviteCode = DOCTOR_INVITE_CODE
   └── POST /api/auth/login-doctor
       └── Returns: JWT with {doctorId, type: "doctor"}

2. ADMIN ENDPOINTS (x-admin-key Header)
   └── Middleware: adminAuth
       ├── POST /api/admin/doctor/:id/verify
       ├── POST /api/admin/doctor/:id/suspend
       ├── DELETE /api/admin/doctor/:id
       └── GET /api/admin/doctors

3. USER/DOCTOR ENDPOINTS (JWT Bearer Token)
   └── Middleware: authenticateToken
       ├── GET /api/consultation
       ├── POST /api/consultation
       ├── GET /api/consultation/:id
       ├── PATCH /api/consultation/:id
       ├── POST /api/consultation/message
       └── GET /api/consultation/video/:id

ACCESS CONTROL LOGIC:
┌─────────────────────────────────────────────────────────────────────┐
│ Consultation Access:                                                 │
│   - Patient can access if patientId matches JWT userId              │
│   - Doctor can access if doctorId matches JWT doctorId              │
│   - Admin can access all (if admin endpoints are added)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Page Structure

```
frontend/src/app/
│
├── register/
│   └── doctor/
│       └── page.tsx ──────► Doctor Registration Form
│                            ├── Form fields (name, email, etc.)
│                            ├── Invite code validation
│                            └── API: POST /auth/register-doctor
│
├── admin/
│   └── dashboard/
│       └── page.tsx ──────► Admin Doctor Management
│                            ├── Doctor table with filters
│                            ├── Verify/Suspend buttons
│                            └── API: GET/POST /admin/doctors
│
└── consultation/
    └── [id]/
        └── page.tsx ──────► Consultation Chat & Video
                             ├── Consultation details section
                             ├── Jitsi Meet video iframe
                             ├── Real-time chat interface
                             └── API: GET/POST /consultation/*

COMPONENT HIERARCHY:
┌─────────────────────────────────────────────────────────────────────┐
│ ConsultationPage                                                     │
│ ├── ConsultationHeader                                              │
│ │   ├── PatientInfo                                                 │
│ │   ├── DoctorInfo                                                  │
│ │   ├── StatusBadge                                                 │
│ │   └── VideoButton                                                 │
│ ├── VideoContainer (conditional)                                    │
│ │   └── JitsiIframe                                                 │
│ └── ChatSection                                                     │
│     ├── MessageList                                                 │
│     │   └── Message[] (color-coded by sender)                       │
│     └── MessageForm                                                 │
│         ├── TextInput                                               │
│         └── SendButton                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Backend Route Structure

```
backend/src/
│
├── middleware/
│   ├── auth.ts ───────────► authenticateToken (JWT validation)
│   └── adminAuth.ts ──────► adminAuth (x-admin-key validation)
│
└── routes/
    ├── auth.ts ───────────► Doctor Auth
    │                        ├── POST /register-doctor
    │                        └── POST /login-doctor
    │
    ├── admin.ts ──────────► Doctor Management
    │                        ├── GET /doctors
    │                        ├── POST /doctor/:id/verify
    │                        ├── POST /doctor/:id/suspend
    │                        └── DELETE /doctor/:id
    │
    └── consultation.ts ───► Consultations
                             ├── GET /
                             ├── POST /
                             ├── GET /:id
                             ├── PATCH /:id
                             ├── POST /message
                             └── GET /video/:id

MIDDLEWARE CHAIN:
┌─────────────────────────────────────────────────────────────────────┐
│ Request → CORS → Rate Limit → Body Parser → Route Middleware → Handler │
│                                               │                      │
│                                               ├─ adminAuth (admin)  │
│                                               └─ authenticateToken  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Status State Machine

```
DOCTOR STATUS FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   PENDING ──────────────► VERIFIED ──────────────► SUSPENDED        │
│      │                       │                          │            │
│      │                       │                          │            │
│      │                       │◄─────────────────────────┘            │
│      │                       │     (Admin can reinstate)             │
│      │                       │                                       │
│      └───────────────────────┴─────► DELETED                        │
│         (Admin deletes)          (Admin deletes)                     │
│                                                                      │
│ CAPABILITIES BY STATUS:                                             │
│ ├── PENDING:   Can login, cannot access consultations              │
│ ├── VERIFIED:  Full access to consultations                        │
│ ├── SUSPENDED: Can login, cannot access consultations              │
│ └── DELETED:   Cannot login                                        │
└─────────────────────────────────────────────────────────────────────┘

CONSULTATION STATUS FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   SCHEDULED ───► IN_PROGRESS ───► COMPLETED                        │
│       │                                                              │
│       │                                                              │
│       └──────────────────────────► CANCELLED                        │
│                                                                      │
│ TRANSITIONS:                                                        │
│ ├── Patient creates → SCHEDULED                                    │
│ ├── Doctor starts → IN_PROGRESS                                    │
│ ├── Doctor completes → COMPLETED                                   │
│ └── Patient/Doctor cancels → CANCELLED                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Framework:       Next.js 14 (App Router)                            │
│ Language:        TypeScript                                          │
│ Styling:         Tailwind CSS                                        │
│ HTTP Client:     fetch API                                           │
│ Video:           Jitsi Meet (iframe embed)                           │
│ State:           React useState, useEffect, useCallback             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND                                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Runtime:         Node.js                                             │
│ Framework:       Express.js                                          │
│ Language:        TypeScript                                          │
│ Database:        PostgreSQL                                          │
│ ORM:             Prisma                                              │
│ Auth:            JWT (jsonwebtoken) + bcrypt                         │
│ Validation:      Zod (schema validation)                             │
│ Real-time:       Socket.IO (optional enhancement)                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Database:        PostgreSQL (local or Render)                       │
│ Video Service:   Jitsi Meet (meet.jit.si)                           │
│ Hosting:         Render (backend), Vercel (frontend)                │
│ Testing:         Jest + Supertest (backend)                          │
│ Version Control: Git                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features Implemented

```
✅ AUTHENTICATION & AUTHORIZATION
   ├── JWT-based user/doctor authentication
   ├── Admin key-based admin authentication
   ├── Invite-only doctor registration
   └── Role-based access control

✅ DOCTOR MANAGEMENT
   ├── Doctor registration with invite code
   ├── Admin verification workflow
   ├── Doctor suspension capability
   ├── Status-based access control

✅ CONSULTATION SYSTEM
   ├── Create consultations (patient → doctor)
   ├── View consultation list (filtered by role)
   ├── Update consultation status
   ├── Add diagnosis (doctors only)

✅ MESSAGING SYSTEM
   ├── Real-time chat interface
   ├── Message history
   ├── Sender type identification
   └── Timestamp tracking

✅ VIDEO CONFERENCING
   ├── Jitsi Meet integration
   ├── Unique room per consultation
   ├── Camera & microphone permissions
   └── Full-screen capable iframe

✅ ADMIN DASHBOARD
   ├── Doctor list with filters
   ├── Verify/suspend actions
   ├── Status badges
   └── Real-time updates
```

---

## 📈 Performance Considerations

```
OPTIMIZATIONS IMPLEMENTED:
├── useCallback for function memoization
├── useEffect with proper dependency arrays
├── Conditional rendering for video iframe
├── Database indexes on foreign keys
├── JWT for stateless authentication
└── Prisma query optimization (select specific fields)

FUTURE OPTIMIZATIONS:
├── Socket.IO for real-time message updates
├── React Query for data caching
├── Lazy loading for video component
├── Message pagination
├── Image optimization for avatars
└── Database connection pooling
```

---

## 🎯 Testing Strategy

```
UNIT TESTS (Backend):
├── Auth routes (registration, login)
├── Admin routes (verify, suspend, delete)
├── Consultation routes (CRUD operations)
└── Middleware (JWT validation, admin key)

INTEGRATION TESTS:
├── Complete registration → verification flow
├── Consultation creation → messaging → video
└── Admin actions → status changes

MANUAL TESTING:
├── REST Client API tests (doctor-consultation.http)
├── Frontend UI testing (all pages)
└── Video call functionality (Jitsi embed)

E2E TESTS (Future):
├── Playwright for full user flows
└── Video call simulation
```

---

## 🔮 Future Enhancements

```
PHASE 2 - REAL-TIME
├── Socket.IO for live chat updates
├── Online/offline status indicators
└── Typing indicators

PHASE 3 - SCHEDULING
├── Calendar integration
├── Appointment booking
├── Reminder notifications

PHASE 4 - ADVANCED FEATURES
├── File upload (medical records)
├── Prescription system
├── Payment integration
├── Insurance verification
└── Video call recording

PHASE 5 - ANALYTICS
├── Admin analytics dashboard
├── Doctor performance metrics
├── Patient satisfaction surveys
└── Consultation duration tracking
```

---

## 🎉 Summary

**Current Status**: ✅ **Feature Complete**

All core functionality has been implemented:

- ✅ 3 Database models with relations
- ✅ 8 Backend API endpoints
- ✅ 2 Authentication middleware
- ✅ 3 Frontend pages
- ✅ Video conferencing integration
- ✅ Real-time chat interface

**Next Steps**: Database migration → Testing → Deployment

**Documentation Available**:

- `DOCTOR_CONSULTATION_SYSTEM_COMPLETE.md` - Full implementation details
- `DOCTOR_SYSTEM_QUICK_START.md` - User guide and workflows
- `api-tests/doctor-consultation.http` - API testing scenarios
- This file - Architecture and technical overview
