/*
  Warnings:

  - You are about to drop the column `token` on the `refresh_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- Revoke all legacy sessions before replacing the plaintext token column.
-- This deployment intentionally requires every user to authenticate again.
DELETE FROM "refresh_tokens";

-- DropIndex
DROP INDEX "refresh_tokens_token_key";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "token",
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
