/*
  Warnings:

  - Made the column `categoryId` on table `Budget` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
