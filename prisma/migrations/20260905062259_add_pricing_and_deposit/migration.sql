-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "depositAmount" DOUBLE PRECISION,
ADD COLUMN     "totalPrice" DOUBLE PRECISION,
ADD COLUMN     "urgentSurchargePct" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "depositAmount" DOUBLE PRECISION;
