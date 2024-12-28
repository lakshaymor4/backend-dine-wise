/*
  Warnings:

  - You are about to drop the column `email` on the `Restraunt` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Restraunt` table. All the data in the column will be lost.
  - Added the required column `address` to the `Restraunt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Restraunt` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Restraunt_email_key";

-- AlterTable
ALTER TABLE "Restraunt" DROP COLUMN "email",
DROP COLUMN "password",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ALTER COLUMN "positive" SET DEFAULT 0,
ALTER COLUMN "negative" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Restraunt" ADD CONSTRAINT "Restraunt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
