import { test, expect } from "@playwright/test";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "Admin123!@#";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+15551234567";

async function fetchDevOtpCode(
  request: import("@playwright/test").APIRequestContext
) {
  const res = await request.post(`${API_URL}/api/auth/admin/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASS, phone: ADMIN_PHONE },
  });
  const json = await res.json();
  if (json?.code) return json.code as string;
  throw new Error("No dev OTP code; ensure backend dev mode returns code");
}

async function createTestTicket(
  page: import("@playwright/test").Page,
  subject: string,
  message: string
) {
  const adminToken = await page.evaluate(() =>
    localStorage.getItem("adminToken")
  );
  if (!adminToken)
    throw new Error("Missing adminToken in localStorage after login");
  const res = await page.request.post(`${API_URL}/api/support/contact`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    data: {
      subject,
      message,
      priority: "LOW",
      category: "GENERAL",
    },
  });
  const json = await res.json();
  if (!res.ok()) {
    throw new Error(
      `Failed to create ticket: ${res.status()} ${JSON.stringify(json)}`
    );
  }
  return json?.ticket?.id as string | undefined;
}

// E2E: Admin can open a ticket detail, toggle related section off/on, and see UI update
// - Logs in via OTP (dev path)
// - Creates a ticket via /api/support/contact using the admin's token
// - Filters ticket list by unique subject and opens Details
// - Toggles "Include related user/crypto" off -> expects "Not requested." text
// - Toggles back on -> expects the "Not requested." text to disappear

test("Admin ticket detail toggles related data", async ({ page, request }) => {
  // Go to admin login
  await page.goto(`${FRONTEND_BASE}/admin/login`);

  // Fill credentials
  await page.getByLabel(/Admin Email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Password/i).fill(ADMIN_PASS);
  await page.getByLabel(/Phone Number/i).fill(ADMIN_PHONE);

  // Send OTP
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/admin/login")),
    page.getByRole("button", { name: /send otp/i }).click(),
  ]);

  // Verify OTP step visible
  await expect(
    page.getByRole("heading", { name: /verify otp/i })
  ).toBeVisible();

  // Fetch dev OTP code (overwrites/ensures a recent one)
  const code = await fetchDevOtpCode(request);

  // Submit OTP
  await page.getByLabel(/Verification Code/i).fill(code);
  await Promise.all([
    page.waitForNavigation({ url: /.*\/admin\/sessions/ }),
    page.getByRole("button", { name: /verify otp/i }).click(),
  ]);

  // Create a unique ticket via API using the admin token
  const unique = Date.now();
  const subject = `E2E Ticket ${unique}`;
  await createTestTicket(
    page,
    subject,
    "Automated test ticket for detail view"
  );

  // Navigate to Tickets list and filter by subject
  await page.goto(`${FRONTEND_BASE}/admin/tickets`);
  await page.getByPlaceholder(/Search subject or message/i).fill(subject);
  await page.getByRole("button", { name: /^Refresh$/ }).click();

  // Wait for the ticket card with our subject
  const ticketCard = page.getByText(subject).locator("..").first();
  await expect(page.getByText(subject)).toBeVisible();

  // Open Details within that card
  const detailsLink = ticketCard.getByRole("link", { name: /^Details$/ });
  await Promise.all([
    page.waitForURL(/.*\/admin\/tickets\/[^/]+$/),
    detailsLink.click(),
  ]);

  // Ensure Ticket Details header is visible
  await expect(
    page.getByRole("heading", { name: /ticket details/i })
  ).toBeVisible();

  // Related section should be visible
  await expect(page.getByText(/Related User & Crypto/i)).toBeVisible();

  // Toggle related OFF, refresh, expect "Not requested." text
  await page.getByLabel(/Include related user\/crypto/i).uncheck();
  await Promise.all([
    page.waitForResponse((r) =>
      r.url().includes("/api/support/admin/tickets/")
    ),
    page.getByRole("button", { name: /^Refresh$/ }).click(),
  ]);
  await expect(page.getByText(/Not requested\./i)).toBeVisible();

  // Toggle related ON, refresh, expect "Not requested." to disappear
  await page.getByLabel(/Include related user\/crypto/i).check();
  await Promise.all([
    page.waitForResponse((r) =>
      r.url().includes("/api/support/admin/tickets/")
    ),
    page.getByRole("button", { name: /^Refresh$/ }).click(),
  ]);
  await expect(page.getByText(/Not requested\./i)).toBeHidden();
});
