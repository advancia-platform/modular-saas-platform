// backend/scripts/import-data.js
// Imports data from JSON backup into database

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData(jsonFilePath) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║           📥 DATA IMPORT FROM JSON                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Read JSON file
  console.log('📖 Reading backup file...');
  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  console.log(`✅ Loaded backup from: ${data.exportDate}\n`);

  let stats = {
    users: 0,
    adminSettings: 0,
    cryptoOrders: 0,
    cryptoWithdrawals: 0,
    transactions: 0,
    errors: 0
  };

  try {
    // Import AdminSettings
    console.log('⚙️  Importing admin settings...');
    for (const setting of data.adminSettings || []) {
      try {
        await prisma.adminSettings.upsert({
          where: { id: setting.id },
          update: setting,
          create: setting
        });
        stats.adminSettings++;
      } catch (error) {
        console.log(`  ⚠️  Error importing admin setting ${setting.id}: ${error.message}`);
        stats.errors++;
      }
    }
    console.log(`  ✅ Imported ${stats.adminSettings} admin settings\n`);

    // Import Users (without nested relations)
    console.log('👥 Importing users...');
    for (const user of data.users || []) {
      try {
        const { transactions, cryptoOrders, cryptoWithdrawals, ...userData } = user;
        await prisma.user.upsert({
          where: { id: userData.id },
          update: userData,
          create: userData
        });
        stats.users++;
      } catch (error) {
        console.log(`  ⚠️  Error importing user ${user.id}: ${error.message}`);
        stats.errors++;
      }
    }
    console.log(`  ✅ Imported ${stats.users} users\n`);

    // Import Transactions
    console.log('💰 Importing transactions...');
    for (const transaction of data.transactions || []) {
      try {
        const { user, ...transactionData } = transaction;
        await prisma.transaction.upsert({
          where: { id: transactionData.id },
          update: transactionData,
          create: transactionData
        });
        stats.transactions++;
      } catch (error) {
        console.log(`  ⚠️  Error importing transaction ${transaction.id}: ${error.message}`);
        stats.errors++;
      }
    }
    console.log(`  ✅ Imported ${stats.transactions} transactions\n`);

    // Import Crypto Orders
    console.log('🪙  Importing crypto orders...');
    for (const order of data.cryptoOrders || []) {
      try {
        const { user, ...orderData } = order;
        await prisma.cryptoOrder.upsert({
          where: { id: orderData.id },
          update: orderData,
          create: orderData
        });
        stats.cryptoOrders++;
      } catch (error) {
        console.log(`  ⚠️  Error importing order ${order.id}: ${error.message}`);
        stats.errors++;
      }
    }
    console.log(`  ✅ Imported ${stats.cryptoOrders} crypto orders\n`);

    // Import Crypto Withdrawals
    console.log('💳 Importing crypto withdrawals...');
    for (const withdrawal of data.cryptoWithdrawals || []) {
      try {
        const { user, ...withdrawalData } = withdrawal;
        await prisma.cryptoWithdrawal.upsert({
          where: { id: withdrawalData.id },
          update: withdrawalData,
          create: withdrawalData
        });
        stats.cryptoWithdrawals++;
      } catch (error) {
        console.log(`  ⚠️  Error importing withdrawal ${withdrawal.id}: ${error.message}`);
        stats.errors++;
      }
    }
    console.log(`  ✅ Imported ${stats.cryptoWithdrawals} crypto withdrawals\n`);

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           ✅ IMPORT COMPLETED!                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📊 Import Summary:');
  console.log(`  • Users: ${stats.users}`);
  console.log(`  • Admin Settings: ${stats.adminSettings}`);
  console.log(`  • Transactions: ${stats.transactions}`);
  console.log(`  • Crypto Orders: ${stats.cryptoOrders}`);
  console.log(`  • Crypto Withdrawals: ${stats.cryptoWithdrawals}`);
  console.log(`  • Errors: ${stats.errors}\n`);

  if (stats.errors > 0) {
    console.log('⚠️  Some records failed to import. Check logs above.');
  } else {
    console.log('✅ All records imported successfully!');
  }
  
  console.log('\n💡 Next: Restart backend server and verify data\n');
}

// Get file path from command line
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ Error: Please provide path to JSON backup file');
  console.log('\nUsage: node import-data.js <path-to-backup.json>');
  console.log('Example: node import-data.js ../backups/2025-10-16/data-export.json\n');
  process.exit(1);
}

if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Error: File not found: ${jsonFilePath}\n`);
  process.exit(1);
}

importData(jsonFilePath)
  .catch(console.error);
