/*
  Warnings:

  - Added the required column `city` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "city" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "quantityNeeded" INTEGER NOT NULL DEFAULT 1,
    "capacityNeeded" INTEGER,
    "budget" DOUBLE PRECISION,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
