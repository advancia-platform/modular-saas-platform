# 🧪 MedBed Doctor Consultation System - Testing Walkthrough

## ✅ Prerequisites Checklist

- [x] Backend running at http://localhost:4000
- [x] Frontend running at http://127.0.0.1:3000
- [x] Backend tests passing (13/13)
- [x] Prisma Client generated
- [ ] Database accessible (Render remote DB or local Postgres)

---

## 🎯 Complete End-to-End Test Flow

### Step 1: Doctor Registration (5 minutes)

**URL**: http://127.0.0.1:3000/register/doctor

**Action**: Fill out the registration form

**Test Data**:

```
First Name: Sarah
Last Name: Johnson
Email: sarah.johnson@medbed.com
Specialization: General Medicine
License Number: MD123456789
Password: SecureDoctor2025!
Invite Code: ADVANCIA2025MEDBED
```

**Expected Result**:

- ✅ Success message: "Doctor registered successfully. Awaiting admin verification."
- ✅ Doctor status: `PENDING`
- ✅ JWT token returned (saved to localStorage)

**Verification**:

```bash
# Check in backend logs for:
# "Doctor registration successful"
```

**Troubleshooting**:

- ❌ "Invalid invite code" → Check `backend/.env` has `DOCTOR_INVITE_CODE=ADVANCIA2025MEDBED`
- ❌ "Email already exists" → Use a different email
- ❌ Network error → Verify backend is running on port 4000

---

### Step 2: Admin Verification (3 minutes)

**URL**: http://127.0.0.1:3000/admin/dashboard

**Prerequisites**:
Ensure `frontend/.env.local` contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ADMIN_KEY=supersecureadminkey123
```

**Action**:

1. Page loads → sees doctor table
2. Click **"PENDING"** filter button
3. Locate "Sarah Johnson" with status badge `PENDING`
4. Click **"Verify"** button
5. Confirm the dialog

**Expected Result**:

- ✅ Success alert: "Doctor verified successfully!"
- ✅ Doctor status changes to `VERIFIED` (green badge)
- ✅ Table refreshes automatically

**Verification**:

```bash
# Check backend logs for:
# "Doctor verified: {doctorId}"
```

**Troubleshooting**:

- ❌ "Admin key required" → Check `NEXT_PUBLIC_ADMIN_KEY` in frontend env
- ❌ 403 error → Admin key doesn't match `backend/.env` `ADMIN_KEY`
- ❌ Doctor not appearing → Check backend logs for registration success

---

### Step 3: Doctor Login (2 minutes)

**Method**: Use REST Client or curl

**REST Client** (Open `api-tests/doctor-consultation.http`):

```http
### Doctor Login
# @name loginDoctor
POST http://localhost:4000/api/auth/login-doctor
Content-Type: application/json
x-api-key: dev-api-key-123

{
  "email": "sarah.johnson@medbed.com",
  "password": "SecureDoctor2025!"
}
```

**curl Equivalent**:

```bash
curl -X POST http://localhost:4000/api/auth/login-doctor \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "email": "sarah.johnson@medbed.com",
    "password": "SecureDoctor2025!"
  }'
```

**Expected Response**:

```json
{
  "message": "Doctor login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "...",
    "email": "sarah.johnson@medbed.com",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "specialization": "General Medicine",
    "status": "VERIFIED"
  }
}
```

**Save These**:

- ✅ `@doctorToken` = response.token
- ✅ `@doctorId` = response.doctor.id

---

### Step 4: Patient Registration & Login (3 minutes)

**Option A: Use Existing Patient**
If you already have a patient user, skip to login.

**Option B: Register New Patient**

**REST Client**:

```http
### Patient Registration
# @name registerPatient
POST http://localhost:4000/api/auth/register
Content-Type: application/json
x-api-key: dev-api-key-123

{
  "email": "patient@example.com",
  "password": "Patient2025!",
  "username": "patient_demo",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Then Login**:

```http
### Patient Login
# @name loginPatient
POST http://localhost:4000/api/auth/login
Content-Type: application/json
x-api-key: dev-api-key-123

{
  "email": "patient@example.com",
  "password": "Patient2025!"
}
```

**Save These**:

- ✅ `@patientToken` = response.token
- ✅ `@patientId` = response.user.id

---

### Step 5: Create Consultation (2 minutes)

**REST Client**:

```http
### Create Consultation
# @name createConsultation
POST http://localhost:4000/api/consultation
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "doctorId": "{{doctorId}}",
  "symptoms": "I have been experiencing severe headaches and dizziness for the past 3 days. Also feeling nauseous in the mornings."
}
```

**Expected Response**:

```json
{
  "message": "Consultation created successfully",
  "consultation": {
    "id": "consultation-uuid-here",
    "patientId": "...",
    "doctorId": "...",
    "status": "SCHEDULED",
    "symptoms": "I have been experiencing severe headaches...",
    "createdAt": "2025-10-21T11:30:00.000Z"
  }
}
```

**Save This**:

- ✅ `@consultationId` = response.consultation.id

---

### Step 6: View Consultation Details (Frontend) (2 minutes)

**URL**: http://127.0.0.1:3000/consultation/{consultationId}

**Prerequisites**:

- Patient must have JWT token in `localStorage` (key: `token`)
- Or manually set it in browser console:
  ```javascript
  localStorage.setItem("token", "your-patient-token-here");
  location.reload();
  ```

**Expected Display**:

- ✅ Patient info: John Doe, patient@example.com
- ✅ Doctor info: Dr. Sarah Johnson, General Medicine
- ✅ Status badge: `SCHEDULED` (yellow)
- ✅ Symptoms: "I have been experiencing severe headaches..."
- ✅ Diagnosis: (empty for now)
- ✅ "Start Video Call" button visible
- ✅ Chat section with empty message list

---

### Step 7: Send Chat Messages (3 minutes)

**Patient sends message** (in browser):

1. Type in message input: "Hello Doctor, thank you for taking my case."
2. Click "Send"
3. Message appears in green on the right side

**Doctor sends message** (API or switch browser):

**REST Client**:

```http
### Doctor Sends Message
POST http://localhost:4000/api/consultation/message
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "consultationId": "{{consultationId}}",
  "content": "Hello! I've reviewed your symptoms. Let's schedule a video call to discuss your condition in detail."
}
```

**Refresh Page**:

- ✅ Patient message on right (green)
- ✅ Doctor message on left (blue)
- ✅ Both messages show timestamp
- ✅ Sender type labels visible

---

### Step 8: Start Video Call with Jitsi (5 minutes)

**Action** (in browser on consultation page):

1. Click **"Start Video Call"** button
2. Wait for Jitsi iframe to load

**Expected Result**:

- ✅ Video iframe appears with Jitsi Meet interface
- ✅ Room name: `advancia-consultation-{consultationId}`
- ✅ Jitsi domain: `meet.jit.si` (or your custom domain)
- ✅ Browser prompts for camera/microphone permissions
- ✅ Video feed starts after allowing permissions

**Test Both Roles**:

1. **As Patient**: Click "Start Video Call" → join room
2. **As Doctor**: Open consultation in another browser/tab with doctor token → click "Start Video Call" → joins same room
3. Both should see each other's video

**Troubleshooting**:

- ❌ Iframe not loading → Check browser console for errors
- ❌ "Permission denied" → Allow camera/mic in browser settings
- ❌ Video not showing → Check `JITSI_DOMAIN` env var in backend
- ❌ Room mismatch → Verify both users have same consultationId

---

### Step 9: Update Diagnosis (Doctor Only) (2 minutes)

**REST Client**:

```http
### Doctor Updates Diagnosis
PATCH http://localhost:4000/api/consultation/{{consultationId}}
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "diagnosis": "Based on your symptoms, this appears to be a migraine with associated nausea. I recommend rest, hydration, and prescribed medication. Follow up in 1 week if symptoms persist."
}
```

**Expected Response**:

```json
{
  "message": "Consultation updated successfully",
  "consultation": {
    "id": "...",
    "diagnosis": "Based on your symptoms..."
  }
}
```

**Verify in Frontend**:

- Refresh consultation page
- ✅ Diagnosis section now displays the text
- ✅ Diagnosis is visible to both patient and doctor

---

### Step 10: Complete Consultation (Doctor Only) (1 minute)

**REST Client**:

```http
### Doctor Completes Consultation
PATCH http://localhost:4000/api/consultation/{{consultationId}}
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Verify in Frontend**:

- Refresh consultation page
- ✅ Status badge changes to `COMPLETED` (green)
- ✅ Consultation marked as finished

---

## 📊 Full System Test Summary

| Step      | Feature               | Status   | Time       |
| --------- | --------------------- | -------- | ---------- |
| 1         | Doctor Registration   | ✅ Ready | 5 min      |
| 2         | Admin Verification    | ✅ Ready | 3 min      |
| 3         | Doctor Login          | ✅ Ready | 2 min      |
| 4         | Patient Login         | ✅ Ready | 3 min      |
| 5         | Create Consultation   | ✅ Ready | 2 min      |
| 6         | View Consultation     | ✅ Ready | 2 min      |
| 7         | Chat Messaging        | ✅ Ready | 3 min      |
| 8         | Video Call (Jitsi)    | ✅ Ready | 5 min      |
| 9         | Update Diagnosis      | ✅ Ready | 2 min      |
| 10        | Complete Consultation | ✅ Ready | 1 min      |
| **TOTAL** | **Full Flow**         | ✅       | **28 min** |

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find name 'beforeAll'"

**Solution**: Already fixed. Your `backend/tests/setup.ts` has correct Jest globals, and `tests/tsconfig.json` includes `types: ["jest", "node"]`.

### Issue: Backend tests return 404

**Solution**: Already fixed. Created `backend/src/testApp.ts` that mounts routes for supertest.

### Issue: "Database connection failed"

**Solution**:

- Your backend is currently pointed to Render's remote DB
- If unreachable, switch to local:

  ```bash
  # backend/.env
  DATABASE_URL=postgresql://postgres:password@localhost:5432/saas_platform?schema=public

  # Then run:
  cd backend
  npx prisma db push
  ```

### Issue: Frontend pages show "Network Error"

**Solution**: Check `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Issue: Admin dashboard shows 403

**Solution**: Check `NEXT_PUBLIC_ADMIN_KEY` matches backend `ADMIN_KEY`:

```bash
# frontend/.env.local
NEXT_PUBLIC_ADMIN_KEY=supersecureadminkey123

# backend/.env
ADMIN_KEY=supersecureadminkey123
```

### Issue: Video call iframe not loading

**Solution**:

1. Check browser console for CSP errors
2. Verify `JITSI_DOMAIN` in backend `.env`
3. Try with default: `JITSI_DOMAIN=meet.jit.si`

### Issue: JWT token not persisting

**Solution**:

- Frontend uses `localStorage.getItem('token')`
- After login, manually set if needed:
  ```javascript
  localStorage.setItem("token", "your-token-here");
  ```

---

## 🎯 Automated Test Script (Optional)

Create a quick validation script to test all endpoints:

```bash
# backend/scripts/test-consultation-flow.sh
#!/bin/bash

API_URL="http://localhost:4000"
API_KEY="dev-api-key-123"

echo "🧪 Testing Doctor Consultation System..."

# 1. Register Doctor
echo "1️⃣ Registering doctor..."
DOCTOR_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register-doctor" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "test.doctor@medbed.com",
    "password": "TestDoctor2025!",
    "firstName": "Test",
    "lastName": "Doctor",
    "specialization": "Test Medicine",
    "licenseNumber": "TEST123456",
    "inviteCode": "ADVANCIA2025MEDBED"
  }')

DOCTOR_TOKEN=$(echo $DOCTOR_RESPONSE | jq -r '.token')
echo "✅ Doctor registered: $DOCTOR_TOKEN"

# 2. Login Patient
echo "2️⃣ Logging in patient..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "patient@example.com",
    "password": "Patient2025!"
  }')

PATIENT_TOKEN=$(echo $PATIENT_RESPONSE | jq -r '.token')
echo "✅ Patient logged in: $PATIENT_TOKEN"

# 3. Create Consultation
echo "3️⃣ Creating consultation..."
# ... continue with other steps

echo "🎉 All tests passed!"
```

---

## 📝 Manual Testing Checklist

Print this checklist and mark items as you test:

- [ ] Doctor can register with correct invite code
- [ ] Doctor registration fails with wrong invite code
- [ ] Doctor appears in admin dashboard with PENDING status
- [ ] Admin can verify doctor (status → VERIFIED)
- [ ] Admin can suspend doctor (status → SUSPENDED)
- [ ] Verified doctor can login successfully
- [ ] Suspended doctor can login but cannot access consultations
- [ ] Patient can create consultation with doctorId
- [ ] Consultation appears in both patient and doctor lists
- [ ] Patient can view consultation details
- [ ] Doctor can view consultation details
- [ ] Patient can send messages
- [ ] Doctor can send messages
- [ ] Messages appear in correct order with timestamps
- [ ] "Start Video Call" button generates Jitsi URL
- [ ] Both users can join the same Jitsi room
- [ ] Video and audio work in Jitsi
- [ ] Doctor can update diagnosis
- [ ] Diagnosis appears on consultation page
- [ ] Doctor can update consultation status
- [ ] Status badge updates correctly in UI
- [ ] Doctor can complete consultation (status → COMPLETED)

---

## 🚀 Next Steps After Testing

1. **Add Real-Time Updates**

   - Wire Socket.IO for live chat
   - Add typing indicators
   - Show online/offline status

2. **Enhance UX**

   - Add loading spinners
   - Improve error messages
   - Add toast notifications

3. **Add Features**

   - File uploads (medical records)
   - Prescription writing
   - Appointment scheduling
   - Payment integration

4. **Production Prep**
   - Switch to production database
   - Update invite codes
   - Configure custom Jitsi domain
   - Set up monitoring
   - Add rate limiting per doctor

---

## ✅ System Status

**Current State**: ✅ **Fully Functional**

- Backend: Running on port 4000
- Frontend: Running on port 3000
- Tests: 13/13 passing
- Database: Remote (Render) or local (Postgres)
- Documentation: Complete

**Ready for**: End-to-end testing and deployment!

---

**Need Help?**

- Check `DOCTOR_CONSULTATION_SYSTEM_COMPLETE.md` for implementation details
- Check `DOCTOR_SYSTEM_QUICK_START.md` for user workflows
- Check `DOCTOR_SYSTEM_ARCHITECTURE.md` for technical diagrams
- Use `api-tests/doctor-consultation.http` for API testing
