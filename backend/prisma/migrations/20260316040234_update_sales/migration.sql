/*
  Warnings:

  - You are about to drop the column `createdAt` on the `BillVersion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[billNumber]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillVersion" DROP COLUMN "createdAt",
ADD COLUMN     "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "billNumber" TEXT NOT NULL,
ADD COLUMN     "paidAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "boxes" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_billNumber_key" ON "Sale"("billNumber");
