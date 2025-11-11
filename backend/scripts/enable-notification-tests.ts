#!/usr/bin/env ts-node

/**
 * Script to enable the 2 skipped Notification tests
 *
 * This script:
 * 1. Updates integration.test.ts to remove describe.skip
 * 2. Fixes the notification routes to use correct endpoints
 * 3. Adds admin authentication
 */

import * as fs from 'fs';
import * as path from 'path';

const INTEGRATION_TEST_PATH = path.join(__dirname, '../tests/integration.test.ts');

async function enableNotificationTests() {
  console.log('🔧 Enabling Notification Tests...\n');

  // Read the integration test file
  let content = fs.readFileSync(INTEGRATION_TEST_PATH, 'utf-8');

  // Check if already enabled
  if (!content.includes('describe.skip("Notifications"')) {
    console.log('✅ Notification tests are already enabled!');
    return;
  }

  // Replace describe.skip with describe
  content = content.replace(
    'describe.skip("Notifications", () => {',
    'describe("Notifications", () => {'
  );

  // Fix the notification routes (they're under /api/admin/user-approval)
  content = content.replace(
    '.get("/api/notifications")',
    '.get("/api/admin/user-approval/notifications")'
  );

  content = content.replace(
    '.put(`/api/notifications/${notification.id}/read`)',
    '.post(`/api/admin/user-approval/notifications/${notification.id}/mark-read`)'
  );

  // Add admin authentication requirement comment
  const notificationDescribe = content.indexOf('describe("Notifications"');
  const insertPos = content.indexOf('it("should get user notifications"', notificationDescribe);

  if (insertPos > 0) {
    const beforeInsert = content.substring(0, insertPos);
    const afterInsert = content.substring(insertPos);

    content = beforeInsert +
      '    // NOTE: Notification endpoints require ADMIN role\n' +
      '    // They are at /api/admin/user-approval/notifications\n    ' +
      afterInsert;
  }

  // Write the updated content
  fs.writeFileSync(INTEGRATION_TEST_PATH, content, 'utf-8');

  console.log('✅ Updated integration.test.ts:');
  console.log('   - Changed describe.skip to describe');
  console.log('   - Fixed notification routes to /api/admin/user-approval/notifications');
  console.log('   - Fixed mark-read endpoint to POST /mark-read');
  console.log('   - Added admin authentication notes\n');

  console.log('⚠️  IMPORTANT: These tests require ADMIN authentication!');
  console.log('   The tests currently use regular user token (authToken).');
  console.log('   You need to either:');
  console.log('   1. Create an admin user in the test setup');
  console.log('   2. Or modify the tests to use admin credentials\n');

  console.log('📝 Recommended next step:');
  console.log('   Edit tests/integration.test.ts and add admin token setup:');
  console.log('   ```typescript');
  console.log('   let adminToken: string;');
  console.log('   ');
  console.log('   beforeAll(async () => {');
  console.log('     const admin = await createTestAdmin();');
  console.log('     adminToken = generateAdminToken(admin.id);');
  console.log('   });');
  console.log('   ```\n');

  console.log('🧪 Run tests with:');
  console.log('   cd backend && npm test\n');
}

enableNotificationTests().catch(console.error);
