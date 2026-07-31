-- Migration Name: 20260731102700_add_email_verification
-- Description: Non-destructive addition of isEmailVerified field to users table and creation of email_verification_tokens table.

-- AlterTable: Add isEmailVerified with default true to preserve existing users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: Create separate table for email verification tokens
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique index on tokenHash for O(1) secure lookups
CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex: Performance indexes on userId and tokenHash
CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_tokenHash_idx" ON "email_verification_tokens"("tokenHash");

-- AddForeignKey: Cascade delete relation to users table
DO $$ BEGIN
  ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
