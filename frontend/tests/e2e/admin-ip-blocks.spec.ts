import { test, expect, APIRequestContext } from "@playwright/test";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "Admin123!@#";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+15551234567";

async function getDevOtpCode(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/api/auth/admin/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASS, phone: ADMIN_PHONE },
  });
  const json = await res.json();
  if (json?.code) {
    return json.code as string;
  }
  throw new Error(
    "No dev OTP code returned; ensure NODE_ENV=development on backend"
  );
}

// Happy path: login via UI with OTP and manage IP blocks page
// - Accepts either "No active blocks" empty state or unblocks the first listed IP if present
// - Works with local backend dev that returns OTP code in response (development mode)

test("Admin can login and view/unblock IP blocks", async ({
  page,
  request,
}) => {
  // Go to admin login
  await page.goto(`${FRONTEND_BASE}/admin/login`);

  // Fill credentials
  await page.getByLabel("Admin Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByLabel("Phone Number").fill(ADMIN_PHONE);

  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/admin/login")),
    page.getByRole("button", { name: /send otp/i }).click(),
  ]);

  // Verify we're on OTP step
  await expect(
    page.getByRole("heading", { name: /verify otp/i })
  ).toBeVisible();

  // Fetch dev OTP code directly from backend (overwrites any existing OTP)
  const code = await getDevOtpCode(request);

  // Enter OTP
  await page.getByLabel("Verification Code").fill(code);
  await Promise.all([
    page.waitForNavigation({ url: /.*\/admin\/sessions/ }),
    page.getByRole("button", { name: /verify otp/i }).click(),
  ]);

  // Navigate to IP Blocks page
  await page.goto(`${FRONTEND_BASE}/admin/ip-blocks`);

  // Either see empty state or a table row
  const emptyState = page.getByText(/No active blocks/i);
  const unblockButtons = page.getByRole("button", { name: /^Unblock$/ });

  // Wait for either condition to be satisfied
  const appeared = await Promise.race([
    emptyState
      .waitFor({ state: "visible" })
      .then(() => "empty" as const)
      .catch(() => null),
    unblockButtons
      .first()
      .waitFor({ state: "visible" })
      .then(() => "hasRows" as const)
      .catch(() => null),
  ]);

  if (appeared === "hasRows") {
    // Unblock the first IP and expect a success toast
    await unblockButtons.first().click();
    // toast message contains text "Unblocked" + IP; match generic prefix
    await expect(page.getByText(/Unblocked /i)).toBeVisible();
  } else {
    // Empty state present
    await expect(emptyState).toBeVisible();
  }
});
