import { test, expect } from "@playwright/test";

/**
 * E2E test for Admin User Detail page
 * Flow: Login via OTP → Users list → Details → verify profile/balances → switch tabs → suspend toggle
 */

test.describe("Admin User Detail", () => {
  test("should display user details, allow tab switching, and toggle suspend status", async ({
    page,
  }) => {
    // 1. Login as admin via OTP (dev mode)
    await page.goto("http://localhost:3000/admin/login");
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "Admin123!@#");
    await page.fill('input[type="tel"]', "+15551234567");
    await page.click('button:has-text("Send OTP")');

    // Wait until OTP input is visible
    await page.waitForSelector('input[placeholder*="code" i]', {
      timeout: 10000,
    });

    // Fetch OTP via dev helper endpoint
    const codeResp = await page.request.get(
      "http://localhost:4000/api/auth/admin/dev/get-otp?email=admin@advancia.com"
    );
    expect(codeResp.ok()).toBeTruthy();
    const codeData = await codeResp.json();
    const otpCode = (codeData as any).code as string;
    expect(otpCode).toBeTruthy();

    // Enter OTP code and verify
    await page.fill('input[placeholder*="code" i]', otpCode);
    await page.click('button:has-text("Verify OTP")');

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // 2. Navigate to Users page
    await page.goto("http://localhost:3000/admin/users");
    await expect(page.locator("text=User Management")).toBeVisible({
      timeout: 10000,
    });

    // 3. Wait for users table to load (ensure at least one row is visible)
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 10000,
    });

    // 4. Click the first "Details" button
    const firstDetailsButton = page
      .locator('button:has-text("Details")')
      .first();
    await expect(firstDetailsButton).toBeVisible({ timeout: 5000 });
    await firstDetailsButton.click();

    // 5. Verify redirect to user detail page
    await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/, { timeout: 10000 });

    // 6. Verify User Profile Card is visible
    await expect(page.locator("text=User Profile")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Email")).toBeVisible();

    // 7. Verify Balances Card is visible
    await expect(page.locator("text=Balances & Tier")).toBeVisible();
    await expect(page.locator("text=USD Balance")).toBeVisible();

    // 8. Verify KYC section visible on Overview tab
    await expect(page.locator("text=KYC Status")).toBeVisible();

    // 9. Switch to Transactions tab
    const transactionsTab = page.locator('button:has-text("Transactions")');
    await transactionsTab.click();
    await expect(page.locator("text=Recent Transactions")).toBeVisible({
      timeout: 5000,
    });

    // 10. Switch to Activity tab
    const activityTab = page.locator('button:has-text("Activity")');
    await activityTab.click();
    await expect(page.locator("text=Activity Log")).toBeVisible({
      timeout: 5000,
    });

    // 11. Switch back to Overview
    const overviewTab = page.locator('button:has-text("Overview")');
    await overviewTab.click();
    await expect(page.locator("text=User Profile")).toBeVisible({
      timeout: 5000,
    });

    // 12. Test suspend toggle
    const suspendButton = page
      .locator(
        'button:has-text("Suspend User"), button:has-text("Activate User")'
      )
      .first();
    await expect(suspendButton).toBeVisible({ timeout: 5000 });
    const initialButtonText = await suspendButton.textContent();

    // Click suspend/activate button
    await suspendButton.click();

    // Verify confirmation modal appears
    await expect(
      page.locator("text=/Suspend User\\?|Activate User\\?|Are you sure/i")
    ).toBeVisible({ timeout: 3000 });

    // Click confirm button in modal
    const confirmButton = page
      .locator('button:has-text("Suspend"), button:has-text("Activate")')
      .last();
    await confirmButton.click();

    // Wait for toast notification
    await expect(
      page.locator("text=/user suspended|user activated/i")
    ).toBeVisible({ timeout: 10000 });

    // Verify button text changed
    await expect(suspendButton).not.toHaveText(initialButtonText || "", {
      timeout: 5000,
    });

    console.log("✅ Admin User Detail E2E test passed");
  });
});
