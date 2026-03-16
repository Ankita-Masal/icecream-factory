-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "licenseImage" TEXT;

-- AlterTable
ALTER TABLE "Transport" ADD COLUMN     "billItems" JSONB,
ADD COLUMN     "customerId" INTEGER,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "vehicleNumber" TEXT,
ADD COLUMN     "vehicleType" TEXT,
ALTER COLUMN "quantity" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
