CREATE TYPE "Role" AS ENUM ('User', 'Administrator');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "username" VARCHAR(32) NOT NULL,
  "usernameKey" VARCHAR(32) NOT NULL,
  "passwordHash" VARCHAR(256) NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'User',
  "developmentOnly" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_username_format" CHECK ("username" ~ '^[A-Za-z0-9][A-Za-z0-9_]{2,31}$'),
  CONSTRAINT "User_username_normalized" CHECK ("usernameKey" = lower("username"))
);

CREATE TABLE "AuthSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthRateLimit" (
  "key" CHAR(64) NOT NULL,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "AuthRateLimit_count_positive" CHECK ("count" > 0)
);

CREATE UNIQUE INDEX "User_usernameKey_key" ON "User"("usernameKey");
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
