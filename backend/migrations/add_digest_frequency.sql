-- Add digest frequency enum
CREATE TYPE "DigestFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY');

-- Add digest frequency column to notification_preferences if it exists
-- If notification_preferences table doesn't exist, create it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        -- Add digest frequency column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'digestfrequency') THEN
            ALTER TABLE "notification_preferences" ADD COLUMN "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'NONE';
        END IF;
    ELSE
        -- Create notification_preferences table if it doesn't exist
        CREATE TABLE "notification_preferences" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
            "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
            "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
            "transactionAlerts" BOOLEAN NOT NULL DEFAULT true,
            "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
            "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
            "rewardAlerts" BOOLEAN NOT NULL DEFAULT true,
            "adminAlerts" BOOLEAN NOT NULL DEFAULT true,
            "withdrawals" BOOLEAN NOT NULL DEFAULT true,
            "complianceAlerts" BOOLEAN NOT NULL DEFAULT true,
            "auditLogs" BOOLEAN NOT NULL DEFAULT false,
            "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'NONE',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
        );

        -- Create unique constraint for userId
        ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_key" UNIQUE ("userId");

        -- Create indexes
        CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
        CREATE INDEX "notification_preferences_digestFrequency_idx" ON "notification_preferences"("digestFrequency");

        -- Add foreign key constraint if users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END
$$;
