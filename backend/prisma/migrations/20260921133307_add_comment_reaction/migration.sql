-- CreateEnum
CREATE TYPE "CommentReaction" AS ENUM ('LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'FUNNY');

-- AlterTable
ALTER TABLE "PostCommentLike" ADD COLUMN     "reaction" "CommentReaction" NOT NULL DEFAULT 'LIKE';
