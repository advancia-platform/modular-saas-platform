// Seed test data for crypto system demo
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Seeding test data for crypto system...\n')

    // 1. Create test user (if not exists)
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@crypto.demo' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@crypto.demo',
          username: 'testuser',
          passwordHash: 'demo-hash', // In real app, this would be hashed
          firstName: 'Test',
          lastName: 'User',
          usdBalance: 500.00, // $500 balance for testing
          role: 'user',
          createdAt: new Date()
        }
      })
      console.log('✅ Test user created:')
      console.log(`   Email: ${testUser.email}`)
      console.log(`   Balance: $${testUser.usdBalance}`)
    } else {
      console.log('✅ Test user already exists:')
      console.log(`   Email: ${testUser.email}`)
      console.log(`   Balance: $${testUser.usdBalance}`)
    }

    // 2. Create pending crypto orders for demo
    const existingOrders = await prisma.cryptoOrder.count({
      where: { userId: testUser.id }
    })

    if (existingOrders === 0) {
      // Create 2 sample orders
      const order1 = await prisma.cryptoOrder.create({
        data: {
          userId: testUser.id,
          cryptoType: 'BTC',
          usdAmount: 100.00,
          cryptoAmount: 0.00222, // ~$100 at $45k BTC
          exchangeRate: 45000.00,
          processingFee: 2.50,
          totalUsd: 102.50, // includes 2.5% fee
          status: 'pending',
          adminAddress: 'bc1q37a9kpzyea5cahpyx8xpx6v7vr5na64f4cxxnt',
          userWalletAddress: '1A1z7agoat2YLZW51Jno8F2d3K5V7j7fL3',
          createdAt: new Date()
        }
      })

      const order2 = await prisma.cryptoOrder.create({
        data: {
          userId: testUser.id,
          cryptoType: 'ETH',
          usdAmount: 250.00,
          cryptoAmount: 0.08929, // ~$250 at $2800 ETH
          exchangeRate: 2800.00,
          processingFee: 6.25,
          totalUsd: 256.25, // includes 2.5% fee
          status: 'pending',
          adminAddress: '0x2b80613e3569d0ba85BFc9375B20096D72Bad1A8',
          userWalletAddress: '0x742d35Cc6634C0532925a3b844Bc2e7595f6FED3',
          createdAt: new Date()
        }
      })

      console.log('\n✅ Sample crypto orders created:')
      console.log(`   Order 1: ${order1.cryptoAmount} BTC ($${order1.usdAmount} + fees)`)
      console.log(`   Order 2: ${order2.cryptoAmount} ETH ($${order2.usdAmount} + fees)`)
      console.log(`   Status: pending (admin approval needed)`)
    } else {
      console.log(`\n✅ Test user already has ${existingOrders} orders`)
    }

    // 3. Verify admin settings
    const settings = await prisma.adminSettings.findFirst()
    if (settings) {
      console.log('\n✅ Admin Settings:')
      console.log(`   BTC Address: ${settings.btcAddress ? settings.btcAddress.substring(0, 10) + '...' : 'not set'}`)
      console.log(`   ETH Address: ${settings.ethAddress ? settings.ethAddress.substring(0, 10) + '...' : 'not set'}`)
      console.log(`   Exchange Rates: BTC=$${settings.exchangeRateBtc}, ETH=$${settings.exchangeRateEth}`)
      console.log(`   Fee: ${settings.processingFeePercent}%`)
    }

    console.log('\n═══════════════════════════════════════════════════════')
    console.log('🎯 TEST DATA SEEDED SUCCESSFULLY!')
    console.log('═══════════════════════════════════════════════════════')
    console.log('\n📍 Next steps:')
    console.log('   1. Go to http://localhost:3000/admin/crypto')
    console.log('   2. View the "Orders" tab to see pending orders')
    console.log('   3. Click on an order and add a transaction hash to complete it')
    console.log('   4. Submit to mark the order as completed')
    console.log('\n💡 Test credentials:')
    console.log(`   Email: ${testUser.email}`)
    console.log(`   Balance: $${testUser.usdBalance}`)
    console.log('\n')

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
