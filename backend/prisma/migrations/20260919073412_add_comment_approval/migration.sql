/*
  Warnings:

  - A unique constraint covering the columns `[approval_token]` on the table `PostComment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN     "approval_token" TEXT,
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "PostComment_approval_token_key" ON "PostComment"("approval_token");
