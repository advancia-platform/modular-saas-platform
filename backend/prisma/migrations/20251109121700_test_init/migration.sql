/*
  Warnings:

  - You are about to alter the column `totalDeposits` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalWithdrawals` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "totalDeposits" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalWithdrawals" SET DATA TYPE DOUBLE PRECISION;
