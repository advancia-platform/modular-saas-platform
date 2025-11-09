// Seed AdminSettings directly using Prisma (no server required)
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('Usage: node scripts/seedAdminSettings.mjs <settings.json>')
    process.exit(1)
  }
  const settingsPath = path.resolve(args[0])
  if (!fs.existsSync(settingsPath)) {
    console.error(`Settings file not found: ${settingsPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(settingsPath, 'utf8')
  const input = JSON.parse(raw)

  const prisma = new PrismaClient()
  try {
    const existing = await prisma.adminSettings.findFirst()
    let result
    if (existing) {
      result = await prisma.adminSettings.update({
        where: { id: existing.id },
        data: {
          btcAddress: input.btcAddress ?? existing.btcAddress,
          ethAddress: input.ethAddress ?? existing.ethAddress,
          usdtAddress: input.usdtAddress ?? existing.usdtAddress,
          exchangeRateBtc: input.exchangeRateBtc ?? existing.exchangeRateBtc,
          exchangeRateEth: input.exchangeRateEth ?? existing.exchangeRateEth,
          exchangeRateUsdt: input.exchangeRateUsdt ?? existing.exchangeRateUsdt,
          processingFeePercent: input.processingFeePercent ?? existing.processingFeePercent,
          minPurchaseAmount: input.minPurchaseAmount ?? existing.minPurchaseAmount,
        }
      })
    } else {
      result = await prisma.adminSettings.create({
        data: {
          btcAddress: input.btcAddress || null,
          ethAddress: input.ethAddress || null,
          usdtAddress: input.usdtAddress || null,
          exchangeRateBtc: input.exchangeRateBtc ?? 45000,
          exchangeRateEth: input.exchangeRateEth ?? 2800,
          exchangeRateUsdt: input.exchangeRateUsdt ?? 1.0,
          processingFeePercent: input.processingFeePercent ?? 2.5,
          minPurchaseAmount: input.minPurchaseAmount ?? 10,
        }
      })
    }
    console.log('✅ AdminSettings saved:', {
      exchangeRateBtc: result.exchangeRateBtc,
      exchangeRateEth: result.exchangeRateEth,
      exchangeRateUsdt: result.exchangeRateUsdt,
      processingFeePercent: result.processingFeePercent,
      minPurchaseAmount: result.minPurchaseAmount,
    })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('❌ Failed to seed AdminSettings:', e)
  process.exit(1)
})
