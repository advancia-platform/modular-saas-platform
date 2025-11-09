import { test, expect } from "@playwright/test";

/**
 * E2E test for Registration Flow
 * This is the critical path for your launch - users must be able to register
 */

test.describe("Registration Flow", () => {
  test("should register new user successfully", async ({ page }) => {
    // Navigate to registration page
    await page.goto("http://localhost:3000/auth/register");

    // Wait for page to load
    await expect(page.locator("text=/register|sign up/i")).toBeVisible({
      timeout: 10000,
    });

    // Fill registration form
    const uniqueEmail = `user-${Date.now()}@example.com`;

    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder*="First" i]', "Test");
    await page.fill('input[placeholder*="Last" i]', "User");
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.fill('input[placeholder*="Confirm" i]', "TestPassword123!");
    await page.fill('input[type="tel"]', "+1234567890");

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    const isCheckboxVisible = await termsCheckbox
      .isVisible()
      .catch(() => false);
    if (isCheckboxVisible) {
      await termsCheckbox.check();
    }

    // Submit registration
    const submitButton = page.locator('button:has-text("Register")').first();
    await submitButton.click();

    // Wait for success - could be redirect or success message
    await expect(page).toHaveURL(/\/(dashboard|auth\/login|auth\/verify)/i, {
      timeout: 15000,
    });

    console.log("✅ Registration test passed");
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/register");

    // Try invalid email
    await page.fill('input[type="email"]', "not-an-email");
    await page.fill('input[placeholder*="password" i]', "Test123!");

    // Submit should show error or prevent submission
    const submitButton = page.locator('button:has-text("Register")').first();

    // Check if validation error appears
    const errorMessage = page.locator(
      "text=/invalid email|please enter|required/i"
    );
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    if (!isErrorVisible) {
      // Form might allow submission but API should reject
      await submitButton.click();
      await expect(page.locator("text=/error|invalid/i")).toBeVisible({
        timeout: 5000,
      });
    }

    console.log("✅ Email validation test passed");
  });
});

/**
 * E2E test for Login Flow
 */

test.describe("Login Flow", () => {
  test("should login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    // Wait for login form
    await expect(page.locator("text=/login|sign in/i")).toBeVisible({
      timeout: 10000,
    });

    // Fill login form with test credentials
    await page.fill('input[type="email"]', "admin@advancia.test");
    await page.fill('input[type="password"]', "admin123");

    // Submit login
    const submitButton = page.locator('button:has-text("Login")').first();
    await submitButton.click();

    // Wait for dashboard or OTP page
    await expect(page).toHaveURL(/\/(dashboard|auth\/verify|admin)/i, {
      timeout: 15000,
    });

    console.log("✅ Login test passed");
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    await page.fill('input[type="email"]', "nonexistent@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    const submitButton = page.locator('button:has-text("Login")').first();
    await submitButton.click();

    // Should show error message
    await expect(page.locator("text=/error|invalid|incorrect/i")).toBeVisible({
      timeout: 5000,
    });

    console.log("✅ Invalid login error test passed");
  });
});

/**
 * E2E test for Dashboard Access
 */

test.describe("Dashboard Access", () => {
  test("should access dashboard after login", async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[type="email"]', "admin@advancia.test");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button:has-text("Login")');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/(dashboard|admin)/i, { timeout: 15000 });

    // Verify key dashboard elements
    const mainContent = page.locator("main, [role='main']");
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log("✅ Dashboard access test passed");
  });

  test("should prevent access to dashboard without login", async ({ page }) => {
    // Try to access dashboard directly
    await page.goto("http://localhost:3000/dashboard", {
      waitUntil: "networkidle",
    });

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/(login|register)/i, {
      timeout: 10000,
    });

    console.log("✅ Dashboard access control test passed");
  });
});
