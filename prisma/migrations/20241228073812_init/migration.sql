/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Restraunt` table. All the data in the column will be lost.
  - You are about to drop the column `review` on the `Restraunt` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Restraunt" DROP CONSTRAINT "Restraunt_ownerId_fkey";

-- AlterTable
ALTER TABLE "Restraunt" DROP COLUMN "ownerId",
DROP COLUMN "review";

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "restrauntId" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_restrauntId_fkey" FOREIGN KEY ("restrauntId") REFERENCES "Restraunt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
