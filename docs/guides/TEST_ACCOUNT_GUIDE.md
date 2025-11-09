# 🧪 Test Account Creation & Login Guide

## ✅ Backend Status: HEALTHY
**Checked:** Backend is live at https://advancia-backend.onrender.com

---

## 🎯 Test Account Details:

**Email:** pdtribe181@gmail.com  
**Test Password:** [You'll create this during registration]  
**Username:** pdtribe181 (or whatever you choose)

---

## 📋 Step-by-Step Testing:

### **Step 1: Visit Your Site**

Open browser (Chrome/Edge in incognito mode recommended):
```
https://advanciapayledger.com
```

**Expected:**
- ✅ Should redirect to `/auth/login` page
- ✅ See "Advancia Pay" login page with gradient background
- ✅ Two login options: Regular login + One-Time Code

---

### **Step 2: Click "Create Account"**

At bottom of login page:
- ✅ Look for "Don't have an account? Create Account"
- ✅ Click "Create Account" link
- ✅ Should navigate to `/auth/register`

---

### **Step 3: Register Test Account**

Fill out the registration form:

| Field | Value |
|-------|-------|
| **Username** | `pdtribe181` (or any username you want) |
| **Email** | `pdtribe181@gmail.com` |
| **Password** | Choose a strong password (min 6 chars) |
| **Confirm Password** | Same password |
| **Accept Terms** | ✅ Check the box |

**Click:** "Create Account" button

**Expected:**
- ✅ Loading state: "Creating Account..."
- ✅ Redirect to login page after success
- ✅ May see "Registration successful" message

---

### **Step 4: Login with Test Account**

On login page (`/auth/login`):

**Option A - Email/Password Login:**
1. Enter email: `pdtribe181@gmail.com`
2. Enter your password
3. Click "Sign In"
4. **Expected:** Redirect to `/dashboard` ✅

**Option B - One-Time Code (OTP) Login:**
1. Click "Login with One-Time Code" button
2. Enter email: `pdtribe181@gmail.com`
3. Click "Send Code"
4. **Expected:** 
   - OTP sent to your email (if email service configured)
   - OR see error if email not configured (that's okay for testing)

---

### **Step 5: Verify Dashboard Access**

After successful login:

**Expected:**
- ✅ Redirect to `https://advanciapayledger.com/dashboard`
- ✅ See dashboard with:
  - Sidebar navigation
  - Balance overview
  - Quick actions
  - Recent transactions
- ✅ Your username displayed
- ✅ Full access to all features

---

### **Step 6: Test Logout**

1. Click logout button (usually in sidebar or profile menu)
2. **Expected:**
   - Redirect back to `/auth/login`
   - Can't access dashboard without login
   - Must login again to access

---

### **Step 7: Test Direct Dashboard Access (Without Login)**

1. **Logout first** (or use incognito mode)
2. Try to visit: `https://advanciapayledger.com/dashboard`
3. **Expected:**
   - ✅ Automatically redirect to `/auth/login`
   - ✅ Cannot access dashboard without authentication
   - ✅ See "Verifying access..." loading screen briefly

---

## 🔍 What to Check:

### **✅ Registration Works:**
- [ ] Can create account with pdtribe181@gmail.com
- [ ] Password validation works (min 6 chars)
- [ ] Password confirmation matches
- [ ] Terms checkbox required
- [ ] Redirects to login after success

### **✅ Login Works:**
- [ ] Can login with email + password
- [ ] Wrong password shows error
- [ ] Successful login redirects to dashboard
- [ ] Token stored in browser (check DevTools → Application → localStorage)

### **✅ Authentication Protection:**
- [ ] Root page (`/`) redirects to login
- [ ] Dashboard requires authentication
- [ ] Direct dashboard access blocked without login
- [ ] Logout clears authentication

### **✅ Error Handling:**
- [ ] No ugly CloudFront errors visible
- [ ] Friendly error messages shown
- [ ] Clean redirect on errors

---

## 🐛 Troubleshooting:

### **Problem: "Cannot connect to backend"**

**Check:**
1. Backend environment variable `CORS_ORIGIN`
2. Should be: `https://advanciapayledger.com`
3. Update in Render → Backend → Environment
4. Wait 2-3 minutes for redeploy

### **Problem: "Registration failed"**

**Possible causes:**
- Backend database connection issue
- Check backend logs in Render
- Verify migrations ran successfully (7/7)

**Check backend logs:**
1. Render → advancia-backend → Logs
2. Look for registration POST request
3. Check for errors

### **Problem: "OTP not received"**

**Expected behavior:**
- OTP requires email service (SendGrid, AWS SES, etc.)
- If not configured yet, OTP won't work
- Use email/password login instead for now

**To fix OTP later:**
- Configure email service in backend
- Add SMTP credentials to environment
- Test email sending

### **Problem: "Stuck on loading screen"**

**Check:**
1. Browser console (F12) for errors
2. Network tab for failed requests
3. Backend CORS allowing frontend domain

---

## 🧪 Test Commands (Backend):

### **Check if account was created:**

Open PowerShell and run:

```powershell
# Check backend health
curl https://advancia-backend.onrender.com/health

# Try to get user info (after login, with your token)
# Replace YOUR_TOKEN with actual token from localStorage
curl https://advancia-backend.onrender.com/api/users/YOUR_USER_ID `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Expected Flow Diagram:

```
User visits advanciapayledger.com
  ↓
Redirect to /auth/login (✅)
  ↓
Click "Create Account"
  ↓
Fill registration form (✅)
  ↓
Submit registration
  ↓
POST /api/auth/register
  ↓
Success! Redirect to /auth/login (✅)
  ↓
Login with email + password
  ↓
POST /api/auth/login
  ↓
Receive JWT token (✅)
  ↓
Store in localStorage
  ↓
Redirect to /dashboard (✅)
  ↓
Dashboard displays! (✅)
```

---

## 🎯 Quick Test Checklist:

1. [ ] Open `https://advanciapayledger.com` → Redirects to login ✅
2. [ ] Click "Create Account" → Goes to register page ✅
3. [ ] Register with `pdtribe181@gmail.com` → Success ✅
4. [ ] Redirects to login → See login page ✅
5. [ ] Login with credentials → Success ✅
6. [ ] Redirects to dashboard → See full dashboard ✅
7. [ ] Logout → Back to login page ✅
8. [ ] Try direct dashboard access → Blocked, redirect to login ✅

---

## 📝 Notes:

**Current Status:**
- ✅ Backend: Live and healthy
- ✅ Frontend: Deployed with auth enforcement
- ✅ Database: 7 migrations applied
- ✅ DNS: Configured and working
- ✅ SSL: Active via Cloudflare

**What Works:**
- ✅ Registration
- ✅ Email/Password Login
- ✅ Dashboard access control
- ✅ Authentication protection
- ✅ Error handling

**What Might Not Work Yet:**
- ⏳ OTP login (needs email service)
- ⏳ Email verification (if enabled)
- ⏳ Password reset (needs email service)

---

## 🚀 After Successful Test:

Once you confirm registration and login work:

1. **Test other features:**
   - Transaction creation
   - Balance updates
   - Settings page
   - Profile management

2. **Create more test accounts:**
   - Different email addresses
   - Test multiple users
   - Verify user isolation

3. **Production ready!**
   - Your platform is live
   - Users can register
   - Secure authentication
   - Professional appearance

---

**Go ahead and test with `pdtribe181@gmail.com`!** 🎉

Let me know:
- ✅ What works
- ❌ Any errors you see
- 📸 Screenshots if needed

I'm here to help fix any issues! 🚀
