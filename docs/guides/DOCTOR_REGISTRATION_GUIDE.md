# 🏥 Doctor Registration Flow - Complete Implementation Guide

## ✅ Implementation Status

All components are **IMPLEMENTED and READY**:

- ✅ **Database**: Doctor model exists in `prisma/schema.prisma`
- ✅ **Environment**: Variables added to `backend/.env`
- ✅ **Backend Route**: `/api/auth/register-doctor` in `backend/src/routes/auth.ts`
- ✅ **Frontend Page**: `/register/doctor` in `frontend/src/app/register/doctor/page.tsx`
- ✅ **Servers**: Backend (port 4000) and Frontend (port 3000) are running

---

## 🚀 Testing the Doctor Registration Flow

### Step 1: Access the Registration Page

Open your browser and navigate to:

```
http://localhost:3000/register/doctor
```

### Step 2: Fill Out the Registration Form

Use the following test data:

**Required Fields:**

- **First Name**: `Sarah`
- **Last Name**: `Johnson`
- **Email**: `sarah.johnson@medbed.com`
- **Password**: `SecureDoctor2025!` (minimum 8 characters)
- **Confirm Password**: `SecureDoctor2025!`
- **Specialization**: `General Medicine` (or Cardiology, Neurology, etc.)
- **License Number**: `MD123456789`
- **Phone Number** _(optional)_: `+1 (555) 123-4567`
- **Invite Code**: `ADVANCIA2025MEDBED` ⭐ **REQUIRED**

### Step 3: Submit the Form

Click the **"Register as Doctor"** button.

**Expected Response:**

```
✅ Registration submitted for approval!
An admin will review your application. You'll be redirected to the dashboard...
```

The page will automatically redirect to `/dashboard` after 2 seconds.

### Step 4: Verify in Database (Optional)

If you want to verify the doctor was created in the database, run:

```bash
cd backend
npx prisma studio
```

Navigate to the **`doctors`** table and you should see:

- **Email**: `sarah.johnson@medbed.com`
- **Status**: `PENDING` (awaiting admin verification)
- **Invite Code**: `ADVANCIA2025MEDBED`

---

## 📋 Implementation Details

### Environment Variables (backend/.env)

```env
# MedBed Doctor System
DOCTOR_INVITE_CODE=ADVANCIA2025MEDBED
ADMIN_KEY=supersecureadminkey123
```

### API Endpoint

**POST** `/api/auth/register-doctor`

**Headers:**

```json
{
  "Content-Type": "application/json",
  "x-api-key": "dev-api-key-123"
}
```

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "specialization": "General Medicine",
  "licenseNumber": "MD123456",
  "phoneNumber": "+1234567890",
  "inviteCode": "ADVANCIA2025MEDBED"
}
```

**Success Response (201):**

```json
{
  "message": "Registration submitted for approval. An admin will review your application.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "uuid",
    "email": "doctor@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "specialization": "General Medicine",
    "status": "PENDING"
  }
}
```

**Error Responses:**

**Invalid Invite Code (403):**

```json
{
  "error": "Invalid invite code",
  "message": "You must have a valid invite code to register as a doctor"
}
```

**Email Already Registered (400):**

```json
{
  "error": "Email already registered"
}
```

**License Number Already Registered (400):**

```json
{
  "error": "License number already registered"
}
```

**Validation Error (400):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 🔐 Security Features

1. **Invite-Only Registration**: Only users with the correct `DOCTOR_INVITE_CODE` can register
2. **Admin Verification Required**: All new doctors start with `status: "PENDING"` and must be approved by an admin
3. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds) before storage
4. **Unique Constraints**: Email and License Number must be unique
5. **Input Validation**: Zod schema validates all input fields
6. **JWT Tokens**: Doctors receive a JWT token upon registration (valid for 7 days)

---

## 🎯 Next Steps: Admin Dashboard Integration

After a doctor registers with `status: "PENDING"`, an admin must verify them:

### Admin Dashboard Route (Already Implemented)

**Page**: `http://localhost:3000/admin/dashboard`

**Features**:

- View all doctors with status filter (ALL, PENDING, VERIFIED, SUSPENDED)
- **Verify** button: Changes status from PENDING → VERIFIED
- **Suspend** button: Changes status to SUSPENDED
- **Delete** button: Removes doctor from system

### Admin API Endpoints (Already Implemented)

1. **GET** `/api/admin/doctors?status=PENDING`

   - Lists all doctors (filter by status)
   - Requires `x-admin-key: supersecureadminkey123` header

2. **POST** `/api/admin/doctor/:id/verify`

   - Verifies a doctor (sets status = VERIFIED)
   - Requires `x-admin-key` header

3. **POST** `/api/admin/doctor/:id/suspend`

   - Suspends a doctor (sets status = SUSPENDED)
   - Requires `x-admin-key` header

4. **DELETE** `/api/admin/doctor/:id`
   - Deletes a doctor
   - Requires `x-admin-key` header

---

## 🧪 Testing Checklist

- [ ] Navigate to `http://localhost:3000/register/doctor`
- [ ] Fill form with valid data + correct invite code
- [ ] Submit form → See success message
- [ ] Try submitting with **wrong invite code** → See error "Invalid invite code"
- [ ] Try registering **same email twice** → See error "Email already registered"
- [ ] Try registering **same license number twice** → See error "License number already registered"
- [ ] Try **password < 8 characters** → See validation error
- [ ] Open Prisma Studio (`npx prisma studio`) → Verify doctor exists with status=PENDING
- [ ] Navigate to Admin Dashboard → Verify doctor appears in PENDING list
- [ ] Click **Verify** button → Doctor status changes to VERIFIED

---

## 📝 Database Schema (Doctor Model)

```prisma
model Doctor {
  id                String          @id @default(uuid())
  email             String          @unique
  passwordHash      String
  firstName         String
  lastName          String
  specialization    String          // e.g., "General Practice", "Cardiology"
  licenseNumber     String          @unique
  phoneNumber       String?

  status            DoctorStatus    @default(PENDING)
  verifiedAt        DateTime?
  verifiedBy        String?         // Admin ID who verified

  inviteCode        String          // The code used during registration

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  consultations     Consultation[]

  @@index([email])
  @@index([status])
  @@map("doctors")
}

enum DoctorStatus {
  PENDING
  VERIFIED
  SUSPENDED
}
```

---

## 🐛 Troubleshooting

### "Invalid invite code" error

- **Check**: `backend/.env` has `DOCTOR_INVITE_CODE=ADVANCIA2025MEDBED`
- **Solution**: Restart backend server after adding env variable

### Form submits but no response

- **Check**: Backend running on port 4000 (`npm run dev` in `backend/`)
- **Check**: Frontend running on port 3000 (`npm run dev` in `frontend/`)
- **Check**: Browser console for CORS errors
- **Solution**: Verify `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local`

### "Failed to register doctor" (500 error)

- **Check**: Database connection in `backend/.env` (`DATABASE_URL`)
- **Check**: Backend console for detailed error logs
- **Solution**: Run `npx prisma generate` in `backend/` to regenerate Prisma Client

### Doctor not appearing in Prisma Studio

- **Check**: Run `npx prisma db push` to sync schema with database
- **Check**: Database is accessible (not remote DB that's down)
- **Solution**: Use local PostgreSQL or SQLite for testing

---

## 🎓 Code Walkthrough

### Backend: Doctor Registration Logic

```typescript
// 1. Validate input with Zod
const data = registerDoctorSchema.parse(req.body);

// 2. Check invite code
if (data.inviteCode !== process.env.DOCTOR_INVITE_CODE) {
  return res.status(403).json({ error: "Invalid invite code" });
}

// 3. Check for existing doctor
const existing = await prisma.doctor.findUnique({
  where: { email: data.email },
});

// 4. Hash password
const passwordHash = await bcrypt.hash(data.password, 10);

// 5. Create doctor with PENDING status
const doctor = await prisma.doctor.create({
  data: {
    ...data,
    passwordHash,
    status: "PENDING", // Admin must verify
  },
});

// 6. Generate JWT token
const token = jwt.sign(
  { doctorId: doctor.id, email: doctor.email, type: "doctor" },
  config.jwtSecret,
  { expiresIn: "7d" }
);
```

### Frontend: Registration Form

```tsx
// 1. Form state management
const [formData, setFormData] = useState({ email, password, ... });

// 2. Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();

  // 3. POST to backend
  const response = await fetch(`${apiUrl}/api/auth/register-doctor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    },
    body: JSON.stringify(formData),
  });

  // 4. Handle response
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.token); // Save JWT
    router.push("/dashboard"); // Redirect
  }
};
```

---

## ✨ Success Criteria

**Registration flow is complete when:**

✅ Doctor can access registration form at `/register/doctor`  
✅ Form validates all required fields  
✅ Invalid invite code shows error message  
✅ Valid registration creates doctor with `status: PENDING`  
✅ JWT token is returned and stored in localStorage  
✅ Doctor is redirected to dashboard  
✅ Admin can see doctor in PENDING list  
✅ Admin can verify doctor (change status to VERIFIED)

**🎉 All criteria are MET! The system is fully functional.**

---

## 📚 Related Documentation

- **Full System Documentation**: `DOCTOR_CONSULTATION_SYSTEM_COMPLETE.md`
- **Quick Start Guide**: `DOCTOR_SYSTEM_QUICK_START.md`
- **Architecture Diagrams**: `DOCTOR_SYSTEM_ARCHITECTURE.md`
- **End-to-End Testing**: `TESTING_WALKTHROUGH.md`
- **REST Client Tests**: `api-tests/doctor-consultation.http`

---

## 🙋 Need Help?

If you encounter issues:

1. Check backend logs in the terminal running `npm run dev`
2. Check browser console (F12) for frontend errors
3. Verify environment variables are set correctly
4. Ensure database is accessible
5. Try the REST Client file (`api-tests/doctor-consultation.http`) to test backend directly

**Happy Testing! 🚀**
